import { Module, OnApplicationBootstrap, Inject, Logger } from '@nestjs/common';
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
})
export class GatewayModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(GatewayModule.name);
  
  constructor(
    @Inject('TEMPLATE_SERVICE') private readonly client: ClientProxy
  ) {}

  async onApplicationBootstrap() {
    this.setupClientEventHandlers();
    await this.connectClient();
  }

  private setupClientEventHandlers() {
    this.client.connect().catch(err => {
      this.logger.error('Failed to connect to template service:', err);
    });

    (this.client as any).client.on('connect', () => {
      this.logger.log('Connected to template service');
    });

    (this.client as any).client.on('error', (err) => {
      this.logger.error('Template service connection error:', err);
    });

    (this.client as any).client.on('close', () => {
      this.logger.warn('Template service connection closed');
      this.reconnectWithBackoff();
    });
  }

  private async connectClient() {
    try {
      await this.client.connect();
      this.logger.log('Successfully connected to template service');
    } catch (error) {
      this.logger.error('Failed to connect to template service:', error);
      this.reconnectWithBackoff();
    }
  }

  private reconnectWithBackoff(attempt = 1, maxAttempts = 20) {
    if (attempt > maxAttempts) {
      this.logger.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    setTimeout(async () => {
      try {
        this.logger.log(`Attempting to reconnect (attempt ${attempt})`);
        await this.client.connect();
        this.logger.log('Successfully reconnected to template service');
      } catch (error) {
        this.logger.error(`Reconnection attempt ${attempt} failed:`, error);
        this.reconnectWithBackoff(attempt + 1, maxAttempts);
      }
    }, delay);
  }
}
