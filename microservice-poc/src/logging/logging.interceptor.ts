import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

interface LogContext {
  timestamp: string;
  method: string;
  url: string;
  statusCode: number;
  duration: string;
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const body = request.body as Record<string, unknown>;
    const query = request.query;
    const params = request.params;
    const now = Date.now();

    // Skip logging for successful health checks
    const isHealthCheck = url === '/health' && method === 'GET';

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const response = context.switchToHttp().getResponse<Response>();
          const delay = Date.now() - now;

          // Only log if it's not a successful health check
          if (!isHealthCheck || response.statusCode !== 200) {
            const logContext: LogContext & { response?: unknown } = {
              timestamp: new Date().toISOString(),
              method,
              url,
              statusCode: response.statusCode,
              duration: `${delay}ms`,
              body,
              query: query as Record<string, unknown>,
              params: params as Record<string, unknown>,
              response: data,
            };

            this.logger.info(logContext);
          }
        },
        error: (error: Error | HttpException) => {
          const delay = Date.now() - now;
          const statusCode =
            error instanceof HttpException ? error.getStatus() : 500;

          const logContext: LogContext & { error: Record<string, unknown> } = {
            timestamp: new Date().toISOString(),
            method,
            url,
            statusCode,
            duration: `${delay}ms`,
            body,
            query: query as Record<string, unknown>,
            params: params as Record<string, unknown>,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          };

          this.logger.error(logContext);
        },
      }),
    );
  }
}
