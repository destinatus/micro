/* eslint-disable prettier/prettier */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Pool } from 'pg';
import {
  CreateUserResult,
  UpdateUserResult,
  UserChangePayload,
} from '../types/user.type';
import {
  TypedClient,
  TypedClientConfig,
  TypedNotification,
  createTypedClient,
} from '../types/database.type';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config/configuration';

interface PostgresPoolConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

interface TypedPool extends Omit<Pool, 'query' | 'connect'> {
  query(
    queryText: string,
    values?: unknown[],
  ): Promise<any>;
  connect(): Promise<TypedClient>;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: TypedPool;
  private notificationClient: TypedClient | null = null;
  private readonly instanceId: string;

  constructor(
    private configService: ConfigService<Config, true>,
    @Inject('EVENT_EMITTER')
    private eventEmitter: EventEmitter2,
  ) {
    // Get instance ID from server config
    const serverConfig = this.configService.get('server', {
      infer: true,
    });
    this.instanceId = serverConfig.instanceId;

    // Get database config
    const dbConfig = this.configService.get('database', {
      infer: true,
    }).postgres;

    const postgresConfig: PostgresPoolConfig = {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    };

    console.log('Attempting to connect to PostgreSQL with config:', {
      host: postgresConfig.host,
      port: postgresConfig.port,
      database: postgresConfig.database,
      user: postgresConfig.user,
      instanceId: this.instanceId,
    });

    this.pool = new Pool(postgresConfig) as unknown as TypedPool;
  }

  async onModuleInit(): Promise<void> {
    await this.setupNotifications();
    try {
      console.log('Initializing database tables...');

      // Create users table
      console.log('Creating users table...');
      const createTableResult = await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT NOT NULL,
          needs_sync BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_synced_at TIMESTAMP,
          version INTEGER DEFAULT 1,
          last_modified_by TEXT
        )`);

      console.log('Users table created successfully:', createTableResult);

      // Create index
      console.log('Creating indexes on users table...');
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_needs_sync ON users(needs_sync);
        CREATE INDEX IF NOT EXISTS idx_users_version ON users(version);
      `);

      // Create notification function and trigger
      await this.pool.query(`
        CREATE OR REPLACE FUNCTION notify_user_change()
        RETURNS trigger AS $$
        BEGIN
          PERFORM pg_notify(
            'user_changes',
            json_build_object(
              'operation', TG_OP,
              'record', row_to_json(NEW),
              'old_record', row_to_json(OLD),
              'instance_id', NEW.last_modified_by
            )::text
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS user_changes_trigger ON users;
        
        CREATE TRIGGER user_changes_trigger
        AFTER INSERT OR UPDATE OR DELETE ON users
        FOR EACH ROW
        EXECUTE FUNCTION notify_user_change();
      `);
      console.log('Database setup completed successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown database initialization error';
      throw new InternalServerErrorException(
        `Failed to initialize database: ${errorMessage}`,
      );
    }
  }

  private async setupNotifications(): Promise<void> {
    if (this.notificationClient) {
      try {
        await this.notificationClient.end();
      } catch (error) {
        console.error(
          'Error closing existing notification client:',
          error instanceof Error ? error.message : String(error),
        );
      }
      this.notificationClient = null;
    }

    try {
      const dbConfig = this.configService.get('database', {
        infer: true,
      }).postgres;

      const clientConfig: TypedClientConfig = {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      };

      this.notificationClient = createTypedClient(clientConfig);
      await this.notificationClient.connect();
      await this.notificationClient.query('LISTEN user_changes');

      this.notificationClient.on('notification', (msg: TypedNotification) => {
        if (msg.channel === 'user_changes' && msg.payload) {
          try {
            const payload = JSON.parse(msg.payload) as UserChangePayload;
            if (payload.instance_id !== this.instanceId) {
              this.eventEmitter.emit('user.changed', payload);
            }
          } catch (parseError) {
            console.error(
              'Failed to parse notification payload:',
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
            );
          }
        }
      });

      this.notificationClient.on('error', (error: unknown) => {
        console.error(
          'Notification client error:',
          error instanceof Error ? error.message : String(error),
        );
        this.setupNotifications().catch((setupError) => {
          console.error(
            'Failed to reconnect notification client:',
            setupError instanceof Error
              ? setupError.message
              : String(setupError),
          );
        });
      });

      console.log(`Instance ${this.instanceId} listening for user changes`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Failed to setup notifications:', errorMessage);
      throw new InternalServerErrorException(
        `Failed to setup notifications: ${errorMessage}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      if (this.notificationClient) {
        await this.notificationClient.end();
        this.notificationClient = null;
      }
      if (this.pool) {
        await this.pool.end();
      }
    } catch (error: unknown) {
      console.error(
        'Error during cleanup:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async createUser(username: string, email: string): Promise<CreateUserResult> {
    try {
      const result = await this.pool.query(
        `INSERT INTO users (username, email, last_modified_by)
         VALUES ($1, $2, $3)
         RETURNING id, username, email, needs_sync, created_at, updated_at, last_synced_at, version, last_modified_by`,
        [username, email, this.instanceId],
      );
      return result.rows[0];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to create user: ${message}`,
      );
    }
  }

  async updateUser(
    id: number,
    username?: string,
    email?: string,
  ): Promise<UpdateUserResult> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const currentVersion = await client.query(
        'SELECT version FROM users WHERE id = $1 FOR UPDATE',
        [id],
      );

      if (currentVersion.rows.length === 0) {
        throw new Error('User not found');
      }

      const updates: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      if (username) {
        updates.push(`username = $${paramCount}`);
        values.push(username);
        paramCount++;
      }

      if (email) {
        updates.push(`email = $${paramCount}`);
        values.push(email);
        paramCount++;
      }

      if (updates.length === 0) {
        throw new Error('No updates provided');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      updates.push('needs_sync = true');
      updates.push('version = version + 1');
      updates.push('last_modified_by = $' + paramCount);
      values.push(this.instanceId);
      paramCount++;
      values.push(id);

      const result = await client.query<UpdateUserResult>(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, username, email, needs_sync, created_at, updated_at, last_synced_at, version, last_modified_by`,
        values,
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error: unknown) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error(
          'Error during rollback:',
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError),
        );
      }
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown update error';
      throw new InternalServerErrorException(
        `Failed to update user: ${errorMessage}`,
      );
    } finally {
      await client.release();
    }
  }

  async getUser(id: number): Promise<CreateUserResult | null> {
    try {
      const result = await this.pool.query(
        `SELECT id, username, email, needs_sync, created_at, updated_at, last_synced_at, version, last_modified_by
         FROM users
         WHERE id = $1`,
        [id],
      );
      return result.rows[0] || null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(`Failed to get user: ${message}`);
    }
  }

  async getAllUsers(): Promise<CreateUserResult[]> {
    try {
      const result = await this.pool.query(
        `SELECT id, username, email, needs_sync, created_at, updated_at, last_synced_at, version, last_modified_by
         FROM users
         ORDER BY created_at DESC`,
      );
      return result.rows;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(`Failed to get users: ${message}`);
    }
  }

  async getUnsynced() {
    try {
      const result = await this.pool.query(
        `SELECT id, username, email, needs_sync, created_at, updated_at, last_synced_at, version, last_modified_by
         FROM users
         WHERE needs_sync = true
         ORDER BY updated_at ASC`,
      );
      return result.rows;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to get users needing sync: ${message}`,
      );
    }
  }

  async markSynced(id: number){
    try {
      const result = await this.pool.query(
        `UPDATE users
         SET needs_sync = false, last_synced_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );

      if (result.rowCount === 0) {
        throw new Error('User not found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to mark user as synced: ${message}`,
      );
    }
  }

  async deleteUser(id: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ rowCount: number }>(
        'DELETE FROM users WHERE id = $1',
        [id],
      );

      if (!result.rowCount) {
        throw new Error('User not found');
      }
      await client.query('COMMIT');
    } catch (error: unknown) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError: unknown) {
        console.error(
          'Error during rollback:',
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError),
        );
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to delete user: ${message}`,
      );
    } finally {
      await client.release();
    }
  }
}
