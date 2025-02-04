import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { UsersController } from '../users/users.controller';
import { UsersService } from './users.service';
import { SyncModule } from '../sync/sync.module';
import { ConsulModule } from '../consul/consul.module';
import { HealthModule } from '../health/health.module';
import configuration from '../config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    DatabaseModule,
    SyncModule,
    ConsulModule,
    HealthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersServiceModule {}
