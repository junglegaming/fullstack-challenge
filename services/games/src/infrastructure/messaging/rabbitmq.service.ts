import { IEventBus } from '@/application/ports/event-bus.port';

export class RabbitMQService implements IEventBus {
  async publish(event: { type: string; payload: Record<string, unknown> }): Promise<void> {
    console.log('[RabbitMQ] Event published:', event.type, event.payload);
    // TODO: implement actual RabbitMQ publishing
  }
}
