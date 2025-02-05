import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/configuration';
import { ConsulModule } from './consul/consul.module';
import { ExampleModule } from './example/example.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
    DatabaseModule,
    ConsulModule,
    ExampleModule,
    UsersModule,
  ],
})
export class AppModule {}
