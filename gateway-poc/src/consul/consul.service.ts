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
  private healthCheckInterval: NodeJS.Timeout;
  private readonly serviceCache: Map<string, { address: string; port: number; lastCheck: number }> = new Map();
  private readonly CACHE_TTL = 10000; // 10 seconds

  constructor(
    @Inject('CONSUL_CLIENT')
    private readonly consul: Consul.Consul,
    private readonly configService: ConfigService
  ) {
    this.serviceId = `gateway-${process.env.HOSTNAME || os.hostname()}-${Date.now()}`;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.registerService();
      this.logger.log('Gateway service registered with Consul');
      
      // Start periodic health checks
      this.healthCheckInterval = setInterval(async () => {
        try {
          await this.checkServicesHealth();
        } catch (error) {
          this.logger.error('Health check failed:', error);
        }
      }, 5000); // Check every 5 seconds
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      this.logger.error('Failed to initialize Consul service:', err.message);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    await this.deregisterService();
    this.logger.log('Gateway service deregistered from Consul');
  }

  private async checkServicesHealth(): Promise<void> {
    const services = Array.from(this.serviceCache.keys());
    for (const serviceName of services) {
      try {
        const result = await this.consul.health.service(serviceName);
        const healthyServices = (result as Consul.Health.Service[]).filter(
          (service) => service.Checks.every((check) => check.Status === 'passing')
        );

        if (healthyServices.length === 0) {
          this.logger.warn(`No healthy instances found for service: ${serviceName}`);
          this.serviceCache.delete(serviceName);
        }
      } catch (error) {
        this.logger.error(`Health check failed for service ${serviceName}:`, error);
      }
    }
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
    const consulConfig = this.configService.get('app.consul');
    
    if (!consulConfig) {
      throw new Error('Consul configuration not found');
    }

    const registration: ServiceRegistration = {
      id: this.serviceId,
      name: 'api-gateway',
      port,
      check: {
        http: `http://gateway:${port}${consulConfig.healthCheck.route}`,
        interval: consulConfig.healthCheck.interval,
        timeout: consulConfig.healthCheck.timeout,
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
    forceRefresh = false
  ): Promise<{ address: string; port: number }> {
    try {
      // Check cache first
      const cached = this.serviceCache.get(serviceName);
      const now = Date.now();
      
      if (!forceRefresh && cached && (now - cached.lastCheck) < this.CACHE_TTL) {
        return { address: cached.address, port: cached.port };
      }

      // If cache miss or force refresh, query Consul
      const result = await this.consul.health.service(serviceName);
      const services = result as Consul.Health.Service[];
      
      const passingServices = services.filter((service) =>
        service.Checks.every((check) => check.Status === 'passing'),
      );

      if (!passingServices || passingServices.length === 0) {
        this.serviceCache.delete(serviceName);
        throw new Error(`No healthy instances of service ${serviceName} found`);
      }

      const selectedService =
        passingServices[Math.floor(Math.random() * passingServices.length)];

      // Extract container name from service ID if address is empty
      const address = selectedService.Service.Address || 
        selectedService.Service.ID.split('-')[0] || 
        selectedService.Node.Address;
      
      this.logger.debug(`Service details:`, {
        id: selectedService.Service.ID,
        name: selectedService.Service.Service,
        address: selectedService.Service.Address,
        nodeAddress: selectedService.Node.Address,
        resolvedAddress: address
      });
      const port = selectedService.Service.Port;

      this.logger.debug(`Selected service instance: ${address}:${port}`);

      // Update cache
      this.serviceCache.set(serviceName, {
        address,
        port,
        lastCheck: Date.now()
      });

      return { address, port };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Failed to get service ${serviceName}: ${err.message}`);
      throw new Error(`Failed to get service ${serviceName}: ${err.message}`);
    }
  }
}
