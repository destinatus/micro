import { NestFactory } from '@nestjs/core';
import { UsersServiceModule } from './users.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(UsersServiceModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('microservice.port') || 3000;
  await app.listen(port);

  const logger = new Logger('Users');
  const instanceId = configService.get<string>('microservice.instanceId');
  logger.log(
    `Users Microservice instance ${instanceId} is running on port ${port}`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('Users');
  logger.error('Failed to start users service:', error);
  process.exit(1);
});
