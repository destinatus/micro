import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import consul from 'consul';
import * as os from 'os';

interface ConsulHealthCheck {
  Node: {
    Address: string;
  };
  Service: {
    Address: string;
    Port: number;
  };
  Checks: Array<{
    Status: string;
  }>;
}

interface ConsulConfig {
  host: string;
  port: number;
}

interface RegisterOptions {
  id: string;
  name: string;
  port: number;
  check: {
    name: string;
    http: string;
    interval: string;
    timeout: string;
    status: string;
    DeregisterCriticalServiceAfter?: string;
  };
}

@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private consul: consul.Consul | null = null;
  private readonly serviceId: string;
  private readonly logger = new Logger(ConsulService.name);

  constructor(private readonly configService: ConfigService) {
    this.serviceId = `gateway-${process.env.HOSTNAME || os.hostname()}`;
    this.initializeConsul();
  }

  private getConsulConfig(): ConsulConfig {
    const consulConfig = this.configService.get<ConsulConfig>('app.consul');
    if (!consulConfig) {
      throw new Error('Consul configuration not found');
    }
    return consulConfig;
  }

  private initializeConsul(): void {
    try {
      const config = this.getConsulConfig();
      const consulOptions = {
        host: config.host,
        port: config.port,
      };

      this.consul = new consul(consulOptions);
      this.logger.log(
        `Consul client initialized with config: ${JSON.stringify(consulOptions)}`,
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.logger.error('Failed to initialize Consul client:', err.message);
      throw err;
    }
  }

  private validateConsul(): void {
    if (!this.consul) {
      throw new Error('Consul client not initialized');
    }
  }

  async onModuleInit(): Promise<void> {
    await this.registerService();
    console.log('Gateway service registered with Consul');
  }

  async onModuleDestroy(): Promise<void> {
    await this.deregisterService();
    console.log('Gateway service deregistered from Consul');
  }

  private getServicePort(): number {
    const port = this.configService.get<number>('app.port');
    if (!port) {
      throw new Error('Service port not configured');
    }
    return port;
  }

  private async registerService(): Promise<void> {
    this.validateConsul();

    const port = this.getServicePort();
    const registration: RegisterOptions = {
      id: this.serviceId,
      name: 'api-gateway',
      port,
      check: {
        name: 'HTTP Health Check',
        http: `http://localhost:${port}/health`,
        interval: '10s',
        timeout: '5s',
        status: 'passing',
        DeregisterCriticalServiceAfter: '30s',
      },
    };

    try {
      if (!this.consul) throw new Error('Consul client not initialized');
      await this.consul.agent.service.register(registration);
      this.logger.log(`Service registered with ID: ${this.serviceId}`);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to register service: ${err.message}`);
      throw new Error(`Failed to register service: ${err.message}`);
    }
  }

  private async deregisterService(): Promise<void> {
    this.validateConsul();

    try {
      if (!this.consul) throw new Error('Consul client not initialized');
      await this.consul.agent.service.deregister(this.serviceId);
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(`Failed to deregister service: ${err.message}`);
    }
  }

  async getService(
    serviceName: string,
  ): Promise<{ address: string; port: number }> {
    this.validateConsul();

    try {
      if (!this.consul) {
        throw new Error('Consul client not initialized');
      }

      const healthyServices = await this.consul.health.service(serviceName);
      const passingServices = (healthyServices as ConsulHealthCheck[]).filter(
        (service) =>
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
