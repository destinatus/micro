import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Gateway');
  const app = await NestFactory.create(GatewayModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('gateway.port') || 3000;

  await app.listen(port);
  logger.log(`Gateway service is running on port ${port}`);
}
bootstrap().catch((error) => {
  const logger = new Logger('Gateway');
  logger.error('Failed to start gateway service:', error);
  process.exit(1);
});
