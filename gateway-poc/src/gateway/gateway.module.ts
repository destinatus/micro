import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayController } from './gateway.controller';
import { ConsulModule } from '../consul/consul.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConsulModule,
    ClientsModule.registerAsync([
      {
        name: 'TEMPLATE_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: 'template-service',
            port: 3001
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [GatewayController],
})
export class GatewayModule {}
