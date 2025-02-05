import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsulService } from './consul.service';
import Consul from 'consul';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'CONSUL_CLIENT',
      useFactory: (configService: ConfigService) => {
        const consulConfig = configService.get('app.consul');
        return new Consul({
          host: 'consul',
          port: 8500,
        });
      },
      inject: [ConfigService],
    },
    ConsulService,
  ],
  exports: [ConsulService],
})
export class ConsulModule {}
