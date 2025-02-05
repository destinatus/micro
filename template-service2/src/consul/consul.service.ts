import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import { Config } from '../config/configuration';
import Consul from 'consul';

@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private readonly serviceId: string;
  private readonly logger = new Logger(ConsulService.name);

  constructor(
    @Inject('CONSUL_CLIENT') private readonly consul: Consul,
    private readonly configService: ConfigService,
  ) {
    this.serviceId = `${this.configService.get<Config['service']>('app.service').name}-${
      process.env.HOSTNAME || os.hostname()
    }`;
  }

  async onModuleInit(): Promise<void> {
    await this.registerService();
    this.logger.log('Service registered with Consul');
  }

  async onModuleDestroy(): Promise<void> {
    await this.deregisterService();
    this.logger.log('Service deregistered from Consul');
  }

  private getServicePort(): number {
    const port = this.configService.get<number>('app.port');
    if (!port) {
      throw new Error('Service port not configured');
    }
    return port;
  }

  private async registerService(): Promise<void> {
    const port = this.getServicePort();
    const registration = {
      id: this.serviceId,
      name: this.configService.get<Config['service']>('app.service').name,
      port,
      check: {
        name: 'HTTP Health Check',
        http: `http://localhost:${port}/health`,
        interval: '10s',
        timeout: '5s',
        status: 'passing',
        deregistercriticalserviceafter: '30s',
      },
    };

    try {
      await this.consul.agent.service.register(registration);
      this.logger.log(`Service registered with ID: ${this.serviceId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to register service: ${err.message}`);
      throw new Error(`Failed to register service: ${err.message}`);
    }
  }

  private async deregisterService(): Promise<void> {
    try {
      await this.consul.agent.service.deregister({ id: this.serviceId });
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(`Failed to deregister service: ${err.message}`);
    }
  }

  async getService(serviceName: string): Promise<{ address: string; port: number }> {
    try {
      const services = await this.consul.health.service({
        service: serviceName,
        passing: true,
      });

      if (!services || services.length === 0) {
        throw new Error(`No healthy instances of service ${serviceName} found`);
      }

      const selectedService = services[Math.floor(Math.random() * services.length)];
      const address =
        selectedService.Service.Address ||
        selectedService.Node.Address ||
        'localhost';
      const port = selectedService.Service.Port;

      this.logger.debug(`Selected service instance: ${address}:${port}`);

      return { address, port };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to get service ${serviceName}: ${err.message}`);
      throw new Error(`Failed to get service ${serviceName}: ${err.message}`);
    }
  }
}
