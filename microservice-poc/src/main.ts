import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  // Ensure required directories exist
  await Promise.all([
    mkdir(join(__dirname, '../data'), { recursive: true }),
    mkdir(join(__dirname, '../logs'), { recursive: true }),
  ]);

  // Create the HTTP application
  const app = await NestFactory.create(AppModule);

  // Create the TCP microservice
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
    },
    { inheritAppConfig: true },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS for development
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Microservice API')
    .setDescription('API documentation for the microservice')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Start both HTTP and Microservice
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('Service running');
  console.log('- API documentation: http://localhost:3000/api');

  // Handle shutdown signals
  const signals = ['SIGTERM', 'SIGINT'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      void (async () => {
        console.log(`Received ${signal}, starting graceful shutdown...`);
        try {
          await app.close();
          console.log('Application shutdown complete.');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      })();
    });
  });
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
