import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './database.health';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    DatabaseModule,
  ],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator],
})
export class HealthModule {}
