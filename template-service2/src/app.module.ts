import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/configuration';
import { ConsulModule } from './consul/consul.module';
import { HealthModule } from './health/health.module';
import { ExampleModule } from './example/example.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
    ConsulModule,
    HealthModule,
    ExampleModule,
  ],
})
export class AppModule {}
