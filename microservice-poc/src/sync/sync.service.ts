/* eslint-disable prettier/prettier */
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UserChangePayload } from '../types/user.type';
import { TypedEventEmitter } from '../types/events.type';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
  MessagePattern,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SyncService implements OnModuleInit, OnModuleDestroy {
  private readonly instanceId: string;

  private client: ClientProxy;

  constructor(
    private readonly dbService: DatabaseService,
    @Inject(EventEmitter2) private readonly eventEmitter: TypedEventEmitter,
    private readonly configService: ConfigService,
  ) {
    this.instanceId =
      this.configService.get<string>('microservice.instanceId') ?? '1';

    this.client = ClientProxyFactory.create({
      transport: Transport.TCP,
    });
  }

  async onModuleInit(): Promise<void> {
    // Connect to the microservice client
    await this.client.connect();

    // Listen for local user changes
    this.eventEmitter.on('user.changed', (payload: UserChangePayload) => {
      void this.handleLocalUserChange(payload);
    });

    console.log('Sync service initialized for instance', this.instanceId);
  }

  // Handle local user changes and broadcast them
  private async handleLocalUserChange(
    payload: UserChangePayload,
  ): Promise<void> {
    try {
      if (payload.instance_id === this.instanceId) {
        await this.client.emit('user.changed', payload).toPromise();
        console.log(
          'Broadcasted',
          payload.operation,
          'for user',
          payload.record.id,
          'from instance',
          this.instanceId,
        );
        return;
      }

      await this.handleUserChange(payload);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Error in handleLocalUserChange:', error.message);
      throw error; // Re-throw to allow proper error handling up the stack
    }
  }

  // Handle incoming user changes from other instances
  @MessagePattern('user.changed')
  async handleIncomingUserChange(payload: UserChangePayload): Promise<void> {
    if (payload.instance_id === this.instanceId) {
      return; // Ignore our own changes
    }

    await this.handleUserChange(payload);
  }

  private async handleUserChange(payload: UserChangePayload): Promise<void> {
    const { operation, record } = payload;

    try {
      switch (operation) {
        case 'INSERT':
        case 'UPDATE': {
          const existingUser = await this.dbService.getUser(record.id);

          const currentVersion = existingUser?.version ?? 0;
          const incomingVersion = record.version ?? 0;

          if (!existingUser || currentVersion < incomingVersion) {
            // Apply change only if our version is older
            if (operation === 'INSERT') {
              await this.dbService.createUser(record.username, record.email);
              console.log(
                'Created user',
                record.id,
                'from instance',
                payload.instance_id,
              );
            } else {
              await this.dbService.updateUser(
                record.id,
                record.username,
                record.email,
              );
              console.log(
                'Updated user',
                record.id,
                'from instance',
                payload.instance_id,
              );
            }
          } else {
            console.log(
              'Ignoring',
              operation,
              'for user',
              record.id,
              '- our version',
              currentVersion,
              '>= received version',
              incomingVersion,
            );
          }
          break;
        }
        case 'DELETE': {
          await this.dbService.deleteUser(record.id);
          console.log(
            'Deleted user',
            record.id,
            'from instance',
            payload.instance_id,
          );
          break;
        }
        default: {
          throw new Error(`Unsupported operation: ${operation as string}`);
        }
      }
    } catch (error) {
      console.error(
        'Error handling',
        operation,
        'for user',
        record.id,
        ':',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Clean up event listeners and close client connection
    this.eventEmitter.removeAllListeners('user.changed');
    await this.client.close();
  }
}
