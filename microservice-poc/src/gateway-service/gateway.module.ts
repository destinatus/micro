import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GatewayController } from './gateway.controller';
import configuration from '../config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    ClientsModule.registerAsync([
      {
        name: 'USERS_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('users.host'),
            port: configService.get('users.port'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [GatewayController],
})
export class GatewayModule {}
