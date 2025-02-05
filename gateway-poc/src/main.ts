import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  await app.listen(port, '0.0.0.0');
  logger.log(`Gateway is running on: http://0.0.0.0:${port}`);
}
bootstrap();
