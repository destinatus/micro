/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Consul from 'consul';

interface IServiceRegistration {
  id: string;
  name: string;
  address: string;
  tags: string[];
  check: {
    name: string;
    interval: string;
    timeout: string;
  };
  meta: {
    [key: string]: string;
  };
}

interface IConsulServiceInstance {
  Service: string;
  ID: string;
  Tags: string[];
  Meta: { [key: string]: string };
  Port: number;
  Address: string;
}

@Injectable()
export class ConsulService implements OnModuleInit, OnModuleDestroy {
  private readonly consul: Consul;
  private readonly serviceId: string;

  constructor(private configService: ConfigService) {
    const consulHost = this.configService.get<string>('consul.host');
    const consulPort = this.configService.get<number>('consul.port');

    if (!consulHost || !consulPort) {
      throw new Error('Consul configuration is missing');
    }

    this.consul = new Consul({
      host: consulHost,
      port: consulPort,
    });

    const serviceId = this.configService.get<string>('consul.serviceId');
    if (!serviceId) {
      throw new Error('Consul service ID is missing');
    }
    this.serviceId = serviceId;
  }

  async onModuleInit() {
    try {
      await this.registerService();
      console.log(`Service registered with Consul: ${this.serviceId}`);
    } catch (error) {
      console.error('Failed to register service with Consul:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.deregisterService();
      console.log(`Service deregistered from Consul: ${this.serviceId}`);
    } catch (error) {
      console.error('Failed to deregister service from Consul:', error);
    }
  }

  private async registerService() {
    const serviceName = this.configService.get<string>('consul.serviceName');
    const instanceId = this.configService.get<string>('microservice.instanceId');
    const serviceHost = this.configService.get<string>('microservice.host');

    if (!serviceName || !instanceId || !serviceHost) {
      throw new Error('Required service configuration is missing');
    }

    const registration: IServiceRegistration = {
      id: this.serviceId,
      name: serviceName,
      address: serviceHost,
      tags: ['microservice'],
      check: {
        name: `${serviceName} health check`,
        interval: '10s',
        timeout: '5s',
      },
      meta: {
        instanceId,
        serviceName,
      },
    };

    await this.consul.agent.service.register(registration);
  }

  private async deregisterService() {
    await this.consul.agent.service.deregister(this.serviceId);
  }

  async getServiceInstances(
    serviceName: string,
  ): Promise<IConsulServiceInstance[]> {
    const services = await this.consul.agent.service.list();
    const serviceList = Object.values(services) as IConsulServiceInstance[];
    return serviceList.filter((service) => service.Service === serviceName);
  }
}
