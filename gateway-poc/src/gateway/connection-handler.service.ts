import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConsulService } from '../consul/consul.service';

@Injectable()
export class ConnectionHandlerService implements OnModuleInit {
  private readonly logger = new Logger(ConnectionHandlerService.name);
  private isConnected = false;
  private readonly maxRetries = 5;

  constructor(
    private readonly consulService: ConsulService,
    private readonly client: ClientProxy
  ) {}

  async onModuleInit() {
    await this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      if (!this.isConnected) {
        await this.client.connect();
        this.isConnected = true;
        this.logger.log('Successfully connected to template service');
        this.setupClientEventHandlers();
        
        // Keep connection alive with periodic ping
        setInterval(() => {
          if (this.isConnected) {
            this.client.send({ cmd: 'ping' }, {}).subscribe({
              error: (err) => {
                this.logger.warn('Ping failed:', err?.message || err);
                this.isConnected = false;
                this.reconnectWithBackoff();
              }
            });
          }
        }, 5000);
      }
    } catch (error) {
      this.logger.error('Failed to initialize connection:', error);
      this.isConnected = false;
      throw error;
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

  private async reconnectWithBackoff(attempt = 1, maxAttempts = 20) {
    if (attempt > maxAttempts) {
      this.logger.error('Max reconnection attempts reached');
      throw new Error('Max reconnection attempts reached');
    }

    const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      this.logger.log(`Attempting to reconnect (attempt ${attempt})`);
      const service = await this.consulService.getService('template-service', true);
      await this.client.close();
      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Successfully reconnected to template service');
    } catch (error) {
      this.logger.error(`Reconnection attempt ${attempt} failed:`, error);
      return this.reconnectWithBackoff(attempt + 1, maxAttempts);
    }
  }

  async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.isConnected) {
          await this.initializeConnection();
        }

        // Set operation timeout
        const timeout = new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), 10000);
        });

        // Execute operation with timeout
        const result = await Promise.race<T>([operation(), timeout]);
        
        // If operation succeeds, ensure connection stays alive
        this.isConnected = true;
        return result;

      } catch (error) {
        lastError = error;
        this.logger.warn(`Attempt ${attempt} failed:`, error?.message || error);
        
        if (error?.message === 'Connection closed' || error?.message === 'Operation timeout') {
          this.isConnected = false;
          await this.reconnectWithBackoff();
        }

        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error('All retry attempts failed');
    throw lastError;
  }

  async onModuleDestroy() {
    try {
      // Properly close the connection when the module is destroyed
      if (this.isConnected) {
        await this.client.close();
        this.isConnected = false;
        this.logger.log('Connection closed gracefully');
      }
    } catch (error) {
      this.logger.error('Error closing connection:', error);
    }
  }
}
