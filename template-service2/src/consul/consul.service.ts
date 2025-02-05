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
    const address = process.env.HOSTNAME || os.hostname();
    const port = this.getServicePort();
    
    const registration = {
      id: this.serviceId,
      name: this.configService.get<Config['service']>('app.service').name,
      address: address,
      port,
      check: {
        name: 'TCP Health Check',
        tcp: `${address}:${port}`,
        interval: '10s',
        timeout: '5s',
        status: 'passing',
        deregistercriticalserviceafter: '30s',
      },
      tags: ['docker']
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
      
      // Log full service details for debugging
      this.logger.debug('Service details:');
      this.logger.debug('Object:');
      this.logger.debug(JSON.stringify({
        id: selectedService.Service.ID,
        name: selectedService.Service.Service,
        address: selectedService.Service.Address,
        nodeAddress: selectedService.Node.Address,
        resolvedAddress: selectedService.Service.Address || selectedService.Node.Address
      }, null, 2));

      // Use Node address if Service address is not available
      const address = selectedService.Service.Address || selectedService.Node.Address;
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
