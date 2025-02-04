import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UsersServiceModule } from './users.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Users');

  // Get microservice configuration from environment variables
  const microserviceHost = process.env.MICROSERVICE_HOST || '0.0.0.0';
  const microservicePort = parseInt(
    process.env.MICROSERVICE_PORT || '3001',
    10,
  );

  // Create TCP-only microservice
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UsersServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: microserviceHost,
        port: microservicePort,
      },
    },
  );

  // Start the microservice
  await app.listen();

  logger.log(
    `Users Microservice is listening on ${microserviceHost}:${microservicePort}`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('Users');
  logger.error('Failed to start users service:', error);
  process.exit(1);
});
