import { UserChangePayload } from './user.type';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface EventTypes {
  'user.changed': UserChangePayload;
}

export type TypedEventEmitter = {
  emit<K extends keyof EventTypes>(event: K, payload: EventTypes[K]): boolean;
  on<K extends keyof EventTypes>(
    event: K,
    listener: (payload: EventTypes[K]) => void,
  ): TypedEventEmitter;
  removeAllListeners<K extends keyof EventTypes>(event?: K): TypedEventEmitter;
} & Omit<EventEmitter2, 'emit' | 'on' | 'removeAllListeners'>;
