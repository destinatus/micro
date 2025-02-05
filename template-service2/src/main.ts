import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/configuration';

async function bootstrap() {
  // Create a temporary app to get the ConfigService
  const tempApp = await NestFactory.create(AppModule);
  const configService = tempApp.get<ConfigService>(ConfigService);
  const port = configService.get<number>('app.port');
  await tempApp.close();

  const logger = new Logger('Main');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: port,
        retryAttempts: 20,
        retryDelay: 5000,
        host: '0.0.0.0'
      }
    },
  );

  // Global error handling
  app.useGlobalFilters({
    catch: (exception: Error, host: any) => {
      logger.error('Microservice error:', exception);
      return exception;
    }
  });

  // Handle shutdown gracefully
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, gracefully shutting down...`);
      await app.close();
      process.exit(0);
    });
  });

  await app.listen();
  logger.log(`Microservice is running on port ${port}`);
}

bootstrap();
