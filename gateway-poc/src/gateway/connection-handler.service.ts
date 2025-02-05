import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConsulService } from '../consul/consul.service';

@Injectable()
export class ConnectionHandlerService implements OnModuleInit {
  private readonly logger = new Logger(ConnectionHandlerService.name);
  private isConnected = false;
  private readonly maxRetries = 3;

  constructor(
    private readonly consulService: ConsulService,
    private readonly client: ClientProxy
  ) {}

  async onModuleInit() {
    await this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to template service');
      this.setupClientEventHandlers();
    } catch (error) {
      this.logger.error('Failed to initialize connection:', error);
      this.isConnected = false;
      this.reconnectWithBackoff();
    }
  }

  private setupClientEventHandlers() {
    const clientInstance = (this.client as any).client;
    
    if (!clientInstance || typeof clientInstance.on !== 'function') {
      this.logger.warn('Client does not support event handlers, skipping event setup');
      return;
    }

    try {
      clientInstance.on('connect', () => {
        this.logger.log('Connected to template service');
        this.isConnected = true;
      });

      clientInstance.on('error', (err) => {
        this.logger.error('Template service connection error:', err);
      });

      clientInstance.on('close', () => {
        this.logger.warn('Template service connection closed');
        this.isConnected = false;
        this.reconnectWithBackoff();
      });

      this.logger.log('Event handlers set up successfully');
    } catch (error) {
      this.logger.error('Failed to set up event handlers:', error);
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
        this.isConnected = true;
        this.logger.log('Successfully reconnected to template service');
      } catch (error) {
        this.logger.error(`Reconnection attempt ${attempt} failed:`, error);
        this.reconnectWithBackoff(attempt + 1, maxAttempts);
      }
    }, delay);
  }

  async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.isConnected) {
          await this.initializeConnection();
        }
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt} failed:`, error?.message || error);
        
        if (error?.message === 'Connection closed') {
          this.isConnected = false;
          // Try to get a new service instance
          try {
            const service = await this.consulService.getService('template-service', true);
            await this.client.close();
            // The client will reconnect on next operation
            this.logger.log(`Switching to new service instance: ${service.address}:${service.port}`);
          } catch (consulError) {
            this.logger.error('Failed to get new service instance:', consulError);
          }
        }

        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}
