import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UsersServiceModule } from './users.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Create a hybrid application (HTTP + TCP)
  const app = await NestFactory.create(UsersServiceModule);
  const configService = app.get(ConfigService);
  
  // Get microservice configuration
  const microserviceHost = configService.get<string>('MICROSERVICE_HOST', '0.0.0.0');
  const microservicePort = configService.get<number>('MICROSERVICE_PORT', 3001);

  // Register TCP microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: microserviceHost,
      port: microservicePort,
    },
  });

  // Start both HTTP and microservice
  await app.startAllMicroservices();
  await app.listen(3000);
  
  const logger = new Logger('Users');
  logger.log(`Users Service is running on port 3000`);
  logger.log(`Users Microservice is listening on ${microserviceHost}:${microservicePort}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Users');
  logger.error('Failed to start users service:', error);
  process.exit(1);
});
