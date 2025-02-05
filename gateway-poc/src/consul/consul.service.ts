import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import Consul from "consul";

interface ServiceRegistration {
  id: string;
  name: string;
  port: number;
  check: {
    http: string;
    interval: string;
    timeout: string;
    deregistercriticalserviceafter: string;
  };
}

@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private readonly serviceId: string;
  private readonly logger = new Logger(ConsulService.name);

  constructor(
    @Inject('CONSUL_CLIENT') private readonly consul: Consul.Consul,
    private readonly configService: ConfigService
  ) {
    this.serviceId = `gateway-${process.env.HOSTNAME || os.hostname()}-${Date.now()}`;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.registerService();
      this.logger.log('Gateway service registered with Consul');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.logger.error('Failed to initialize Consul service:', err.message);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.deregisterService();
    this.logger.log('Gateway service deregistered from Consul');
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
    const registration: ServiceRegistration = {
      id: this.serviceId,
      name: 'api-gateway',
      port,
      check: {
        http: `http://gateway:${port}/health`,
        interval: '10s',
        timeout: '5s',
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

  async getService(
    serviceName: string,
  ): Promise<{ address: string; port: number }> {
    try {
      const result = await this.consul.health.service(serviceName);
      const services = result as Consul.Health.Service[];
      
      const passingServices = services.filter((service) =>
        service.Checks.every((check) => check.Status === 'passing'),
      );

      if (!passingServices || passingServices.length === 0) {
        throw new Error(`No healthy instances of service ${serviceName} found`);
      }

      const selectedService =
        passingServices[Math.floor(Math.random() * passingServices.length)];

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
