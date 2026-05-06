import { IEventBus } from '@/application/ports/event-bus.port';

const amqp = require('amqplib');

const EXCHANGE_NAME = 'game_events';
const EXCHANGE_TYPE = 'topic';

export class RabbitMQService implements IEventBus {
  private connection: any = null;
  private channel: any = null;
  private readonly url: string;

  constructor() {
    this.url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    if (this.connection) return;
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });
      console.log('[RabbitMQ] Connected and exchange asserted');
    } catch (error) {
      console.error('[RabbitMQ] Failed to connect:', error);
      throw error;
    }
  }

  async publish(event: { type: string; payload: Record<string, unknown> }): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    try {
      const routingKey = event.type;
      const message = Buffer.from(JSON.stringify(event.payload));
      const options = {
        persistent: true,
        messageId: `${event.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };

      this.channel.publish(EXCHANGE_NAME, routingKey, message, options);
      console.log(`[RabbitMQ] Published event: ${event.type}`, event.payload);
    } catch (error) {
      console.error('[RabbitMQ] Failed to publish event:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }
}
