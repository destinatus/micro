import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { join } from 'path';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(
              ({
                timestamp,
                level,
                message,
              }: winston.Logform.TransformableInfo) => {
                const formattedMessage =
                  typeof message === 'object' && message !== null
                    ? JSON.stringify(message, null, 2)
                    : String(message);
                return `${String(timestamp)} [${String(level)}]: ${formattedMessage}`;
              },
            ),
          ),
        }),
        new winston.transports.DailyRotateFile({
          dirname: join(__dirname, '../../logs'),
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.DailyRotateFile({
          dirname: join(__dirname, '../../logs'),
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  providers: [
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class LoggingModule {}
