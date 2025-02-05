import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from './config/configuration';

async function bootstrap() {
  // Create the HTTP application (needed for health checks)
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<Config['port']>('app.port');
  const logger = new Logger('Main');

  // Connect TCP transport for microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      port: port,
    },
  });

  // Start both HTTP and Microservice servers
  await app.startAllMicroservices();
  await app.listen(port);

  logger.log(`🚀 HTTP server is running on: http://localhost:${port}`);
  logger.log(`🔌 TCP Microservice is listening on port: ${port}`);
}

bootstrap();
