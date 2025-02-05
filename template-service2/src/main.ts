import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/configuration';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  // Create the HTTP application (needed for health checks)
  const httpApp = await NestFactory.create(AppModule);
  const configService = httpApp.get<ConfigService>(ConfigService);
  const port = configService.get<number>('app.port');
  
  const logger = new Logger('Main');

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Template Service API')
    .setDescription('The Template Service API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(httpApp, config);
  SwaggerModule.setup('api', httpApp, document);
  
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
    httpApp.listen(port, '0.0.0.0'),
    microservice.listen()
  ]);

  logger.log(`HTTP application is running on: 0.0.0.0:${port}`);
  logger.log(`Microservice is running on port ${port}`);
}

bootstrap();
