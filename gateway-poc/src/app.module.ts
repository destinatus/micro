import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConsulModule } from './consul/consul.module';
import { appConfig } from './config/configuration';
import { GatewayModule } from './gateway/gateway.module';
import { ConsulService } from './consul/consul.service';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
    ConsulModule,
    ClientsModule.registerAsync([
      {
        name: 'TEMPLATE_SERVICE',
        imports: [ConfigModule, ConsulModule],
        inject: [ConfigService, ConsulService],
        useFactory: async (configService: ConfigService, consulService: ConsulService) => {
          try {
            const serviceInstance = await consulService.getService('template-service');
            return {
              transport: Transport.TCP,
              options: {
                host: serviceInstance.address,
                port: serviceInstance.port,
                retryAttempts: 10,
                retryDelay: 3000
              },
            };
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            throw new Error(`Failed to get template service instance: ${err.message}`);
          }
        },
      },
    ]),
    GatewayModule,
    HealthModule,
  ],
})
export class AppModule {}
