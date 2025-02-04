import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SyncModule } from './sync/sync.module';
import { ConsulModule } from './consul/consul.module';
import { HealthModule } from './health/health.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      // Basic configuration that matches our needs
      wildcard: true,
      delimiter: '.',
    }),
    DatabaseModule,
    SyncModule,
    ConsulModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
