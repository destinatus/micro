import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/configuration';

async function bootstrap() {
  const logger = new Logger('Main');
  
  // Create the microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: 3001, // We'll get the actual port after app is created
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

  // Get the ConfigService and update the port
  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get<number>('app.port');
  
  // Update the options with the configured port
  app.options.options = {
    ...app.options.options,
    port: port,
  };

  await app.listen();
  logger.log(`Microservice is running on port ${port}`);
}

bootstrap();
