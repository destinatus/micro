import { Module } from '@nestjs/common';
import { ConnectionHandlerService } from './connection-handler.service';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
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
              retryAttempts: 10,
              retryDelay: 5000,
              keepalive: true,
              reconnect: true,
              maxRetryAttempts: 20,
              maxReconnectAttempts: 20,
              timeout: 10000,
              heartbeatInterval: 5000
            },
          };
        },
        inject: [ConsulService],
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [
    {
      provide: 'TEMPLATE_SERVICE_HANDLER',
      useFactory: (consulService: ConsulService, client: ClientProxy) => {
        return new ConnectionHandlerService(consulService, client);
      },
      inject: [ConsulService, 'TEMPLATE_SERVICE']
    }
  ]
})
export class GatewayModule {}
