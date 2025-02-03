import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConsulModule } from './consul/consul.module';
import { appConfig } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
    ConsulModule,
  ],
})
export class AppModule {}
