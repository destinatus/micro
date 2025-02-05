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
  
  // Create microservice
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: port
      }
    },
  );

  // Start both applications
  await Promise.all([
    httpApp.listen(port),
    microservice.listen()
  ]);

  logger.log(`HTTP application is running on port ${port}`);
  logger.log(`Microservice is running on port ${port}`);
}

bootstrap();
