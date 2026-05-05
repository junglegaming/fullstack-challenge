const amqp = require('amqplib');

import { IEventConsumer } from '../../application/ports/event-bus.port';
import { StructuredLogger } from '../logger/structured-logger';

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 3;

export class RabbitMQConsumer implements IEventConsumer {
  private connection: any;
  private channel: any;
  private handlers: Map<string, (payload: Record<string, unknown>) => Promise<void>> = new Map();
  private logger: StructuredLogger;
  private retryCount: Map<string, number> = new Map();

  constructor(
    private readonly rabbitUrl: string,
    private readonly exchange: string = 'game_events',
    private readonly queuePrefix: string = 'wallet_service',
  ) {
    this.logger = new StructuredLogger('wallet-service-rabbitmq');
  }

  subscribe(eventType: string, handler: (payload: Record<string, unknown>) => Promise<void>): void {
    this.handlers.set(eventType, handler);
    this.logger.info(`Subscribed handler for event type: ${eventType}`);
  }

  async start(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitUrl);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      for (const eventType of Array.from(this.handlers.keys())) {
        const queueName = `${this.queuePrefix}.${eventType}`;
        await this.channel.assertQueue(queueName, { durable: true });
        await this.channel.bindQueue(queueName, this.exchange, eventType);

        this.logger.info(`Queue ${queueName} bound to exchange ${this.exchange} with routing key ${eventType}`);

        await this.channel.consume(queueName, (msg: any) => this.handleMessage(msg, eventType), { noAck: false });
      }

      this.logger.info('RabbitMQ consumer started successfully');
    } catch (error) {
      this.logger.error('Failed to start RabbitMQ consumer', undefined, error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.logger.info('RabbitMQ consumer stopped');
    } catch (error) {
      this.logger.error('Error stopping RabbitMQ consumer', undefined, error as Error);
    }
  }

  private async handleMessage(msg: any, eventType: string): Promise<void> {
    if (!msg) {
      this.logger.warn('Received null message');
      return;
    }

    const channel = this.channel;
    if (!channel) {
      this.logger.error('Channel not available');
      return;
    }

    const messageId = msg.properties.messageId || `${msg.fields.routingKey}-${msg.fields.deliveryTag}`;
    try {
      const content = msg.content.toString();
      const payload: Record<string, unknown> = JSON.parse(content);

      this.logger.info(`Received event ${eventType}`, { messageId, payload });

      const handler = this.handlers.get(eventType);
      if (!handler) {
        this.logger.warn(`No handler for event type ${eventType}, acking`);
        channel.ack(msg);
        return;
      }

      await handler(payload);

      channel.ack(msg);
      this.logger.info(`Event ${eventType} processed successfully`, { messageId });
    } catch (error) {
      this.logger.error(`Error processing event ${eventType}`, { messageId }, error as Error);

      const retries = this.retryCount.get(messageId) || 0;
      if (retries < MAX_RETRIES) {
        this.retryCount.set(messageId, retries + 1);
        this.logger.warn(`Retrying event ${eventType} (${retries + 1}/${MAX_RETRIES})`, { messageId });
        channel.nack(msg, false, false);
        // In a real scenario, send to retry queue with delay.
        setTimeout(() => {
          this.logger.info(`Retry would happen here for ${messageId}`);
        }, RETRY_DELAY_MS);
      } else {
        this.logger.error(`Max retries reached for event ${eventType}, sending to dead-letter`, { messageId });
        channel.nack(msg, false, false);
        this.retryCount.delete(messageId);
      }
    }
  }
}
