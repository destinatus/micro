import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/configuration';
async function bootstrap() {
  // Create the HTTP application (needed for health checks)
  const httpApp = await NestFactory.create(AppModule);
  const configService = httpApp.get<ConfigService>(ConfigService);
  const port = configService.get<number>('app.port');
  
  const logger = new Logger('Main');

  // Create microservice with improved error handling
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
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

  // Global error handling for microservice
  microservice.useGlobalFilters({
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
      await microservice.close();
      process.exit(0);
    });
  });

  // Start both applications
  await Promise.all([
    httpApp.listen(port, '0.0.0.0'),
    microservice.listen()
  ]);

  logger.log(`HTTP application is running on: 0.0.0.0:${port}`);
  logger.log(`Microservice is running on port ${port}`);
}

bootstrap();
