import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayController } from './gateway.controller';
import { ConsulModule } from '../consul/consul.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsulService } from '../consul/consul.service';

@Module({
  imports: [
    ConsulModule,
    ClientsModule.registerAsync([
      {
        name: 'TEMPLATE_SERVICE',
        imports: [ConfigModule, ConsulModule],
        useFactory: async (consulService: ConsulService) => {
          const service = await consulService.getService('template-service');
          return {
            transport: Transport.TCP,
            options: {
              host: service.address,
              port: service.port,
              retryAttempts: 5,
              retryDelay: 3000,
              keepalive: true,
              reconnect: true
            },
          };
        },
        inject: [ConsulService],
      },
    ]),
  ],
  controllers: [GatewayController],
})
export class GatewayModule {}
