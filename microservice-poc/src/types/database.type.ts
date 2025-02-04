/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Client,
  ClientConfig,
  Notification,
  QueryResult,
  QueryResultRow,
} from 'pg';

/**
 * Custom error class for database-related errors
 */
export class DatabaseError extends Error {
  readonly _tag = 'DatabaseError' as const;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }

  static isDatabase(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
  }
}

export interface TypedClientConfig
  extends Required<
    Pick<ClientConfig, 'host' | 'port' | 'database' | 'user' | 'password'>
  > {
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

export interface TypedQueryResult<T extends QueryResultRow>
  extends QueryResult<T> {
  rows: T[];
  rowCount: number;
}

export interface TypedNotification extends Notification {
  channel: string;
  payload?: string;
}

export interface TypedClient extends Omit<Client, 'query' | 'on'> {
  connect(): Promise<void>;
  query<T extends QueryResultRow = QueryResultRow>(
    queryText: string,
    values?: unknown[],
  ): Promise<TypedQueryResult<T>>;
  end(): Promise<void>;
  release(): Promise<void>;
  on(
    event: 'notification',
    listener: (msg: TypedNotification) => void,
  ): TypedClient;
  on(event: 'error', listener: (err: DatabaseError) => void): TypedClient;
  on(event: string, listener: (...args: unknown[]) => void): TypedClient;
}

type SafeClient = Omit<Client, 'query' | 'on'> & {
  query(queryText: string, values?: unknown[]): Promise<QueryResult>;
  on(event: string, listener: (...args: unknown[]) => void): SafeClient;
};

/**
 * Checks if the given value conforms to QueryResult.
 */
function isQueryResult(value: unknown): value is QueryResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'rows' in value &&
    'rowCount' in value
  );
}

/**
 * Validates and coerces a QueryResult to a TypedQueryResult.
 */
interface DbErrorMetadata {
  code: string;
  context?: string;
  cause?: Error;
}

function createDbError(
  message: string,
  metadata: DbErrorMetadata,
): DatabaseError {
  return Object.assign(new DatabaseError(message), metadata);
}

function validateQueryResult<T extends QueryResultRow>(result: unknown): TypedQueryResult<T> {
  const metadata: DbErrorMetadata = {
    code: 'VALIDATION_ERROR',
    context: 'QueryResult',
  };

  if (!isQueryResult(result)) {
    throw createDbError('Invalid result structure', metadata);
  }

  // Type guard for rows
  if (!Array.isArray(result.rows)) {
    throw createDbError('Result rows must be an array', metadata);
  }

  // Validate and transform rows with proper type checking
  const typedRows = result.rows.map((row, index): T => {
    if (row === null || typeof row !== 'object') {
      throw createDbError(`Row at index ${index} must be an object`, metadata);
    }
    // At this point we know it's a non-null object
    return row as T;
  });

  // Ensure rowCount is a number
  const rowCount = result.rowCount ?? 0;

  return {
    ...result,
    rows: typedRows,
    rowCount,
  };
}

export type QueryHandler<T extends QueryResultRow> = (
  queryText: string,
  values?: unknown[],
) => Promise<TypedQueryResult<T>>;

export type MethodHandler<T> = (...args: unknown[]) => Promise<T>;

/**
 * Creates a query handler that wraps the underlying query method.
 */
function createQueryHandler(target: SafeClient): QueryHandler<QueryResultRow> {
  return async function <T extends QueryResultRow = QueryResultRow>(
    queryText: string,
    values?: unknown[],
  ): Promise<TypedQueryResult<T>> {
    try {
      const queryResult: any = await target.query(queryText, values);
      return validateQueryResult<T>(queryResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Query failed: ${message}`);
    }
  };
}

/**
 * Wraps an underlying method so that errors are caught and rethrown as DatabaseErrors.
 */
function createMethodHandler<T>(
  target: SafeClient,
  method: (...args: unknown[]) => T | Promise<T>,
): MethodHandler<T> {
  return async (...args: unknown[]): Promise<T> => {
    try {
      return (await Reflect.apply(method, target, args)) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Method execution failed: ${message}`);
    }
  };
}

/**
 * Creates a typed client proxy that wraps the underlying pg.Client.
 */
export function createTypedClient(config: TypedClientConfig): TypedClient {
  const baseClient = new Client(config);

  const proxyHandler: ProxyHandler<SafeClient> = {
    get(target: SafeClient, prop: PropertyKey, receiver: unknown) {
      if (prop === 'query') {
        return createQueryHandler(target);
      }

      if (prop === 'on') {
        return function onEvent(
          event: string,
          listener: (...args: unknown[]) => void,
        ): SafeClient {
          if (event === 'notification') {
            return target.on(event, (msg: unknown): void => {
              // Type guard for Notification
              if (!msg || typeof msg !== 'object' || !('channel' in msg)) {
                throw createDbError('Invalid notification format', {
                  code: 'NOTIFICATION_ERROR',
                });
              }

              const notification = msg as Notification;
              if (typeof notification.channel !== 'string') {
                throw createDbError('Missing notification channel', {
                  code: 'NOTIFICATION_ERROR',
                });
              }

              const typedMsg: TypedNotification = {
                ...notification,
                channel: notification.channel,
                payload:
                  typeof notification.payload === 'string'
                    ? notification.payload
                    : undefined,
              };

              listener(typedMsg);
            });
          }

          if (event === 'error') {
            return target.on(event, (err: Error): void => {
              listener(
                createDbError(err.message, {
                  code: 'DB_ERROR',
                  cause: err,
                }),
              );
            });
          }

          return target.on(event, listener);
        };
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return async function boundMethod(
          ...args: unknown[]
        ): Promise<unknown> {
          try {
            const method = value.bind(target);
            const handler = createMethodHandler(target, method);
            const result = await handler(...args);
            return result;
          } catch (error) {
            throw createDbError(
              `Method execution failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
              {
                code: 'METHOD_ERROR',
                cause: error instanceof Error ? error : undefined,
              },
            );
          }
        };
      }

      return value;
    },
  };

  return new Proxy(baseClient, proxyHandler) as TypedClient;
}
