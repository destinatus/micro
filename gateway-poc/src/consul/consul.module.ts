import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConsulModule as NestCloudConsulModule } from '@nestcloud/consul';
import { BootModule } from '@nestcloud/boot';
import { ConsulService } from './consul.service';

@Module({
  imports: [
    ConfigModule,
    BootModule.forRoot({
      filePath: 'config.yaml',
    }),
    NestCloudConsulModule.register({
      useFactory: (configService: ConfigService) => {
        const consulConfig = configService.get('app.consul');
        return {
          host: consulConfig.host,
          port: consulConfig.port,
          name: 'api-gateway',
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [ConsulService],
  exports: [ConsulService],
})
export class ConsulModule {}
