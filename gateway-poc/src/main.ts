import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('API Gateway service documentation')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port, '0.0.0.0');
  logger.log(`Gateway is running on: http://0.0.0.0:${port}`);
  logger.log(`Swagger documentation is available at: http://0.0.0.0:${port}/api`);
}
bootstrap();
