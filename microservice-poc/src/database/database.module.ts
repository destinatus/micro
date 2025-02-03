import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot({
      // Global event emitter instance
      global: true,
    }),
  ],
  providers: [
    DatabaseService,
    {
      provide: 'EVENT_EMITTER',
      useFactory: (eventEmitter: EventEmitter2) => eventEmitter,
      inject: [EventEmitter2],
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
