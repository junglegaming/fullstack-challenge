import { IEventBus } from './application/ports/event-bus.port';

export class EventBus implements IEventBus {
  async publish(event: { type: string; payload: Record<string, unknown> }): Promise<void> {
    console.log('Event published:', event);
    // TODO: implement RabbitMQ in future
  }
}
