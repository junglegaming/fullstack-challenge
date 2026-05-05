import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { IOutboxRepository } from '../application/ports/outbox-repository.port';
import { OutboxEvent } from './persistence/entities/outbox-event.entity';
import { StructuredLogger } from './logger/structured-logger';

const amqp = require('amqplib');

const OUTBOX_POLLING_INTERVAL_MS = 5000; // 5 seconds
const MAX_RETRIES = 3;

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private connection?: any;
  private channel?: any;
  private logger: StructuredLogger;
  private pollingInterval?: ReturnType<typeof setInterval>;
  private rabbitUrl: string;
  private exchange: string;

  constructor(
    private readonly outboxRepository: IOutboxRepository,
  ) {
    this.rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.exchange = process.env.RABBITMQ_EXCHANGE || 'wallet_events';
    this.logger = new StructuredLogger('wallet-outbox-publisher');
  }

  async onModuleInit(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitUrl);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });

      // Start polling
      this.pollingInterval = setInterval(() => this.publishPendingEvents(), OUTBOX_POLLING_INTERVAL_MS);
      this.logger.info('OutboxPublisher started');
    } catch (error) {
      this.logger.error('Failed to initialize OutboxPublisher', undefined, error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.logger.info('OutboxPublisher stopped');
  }

  private async publishPendingEvents(): Promise<void> {
    try {
      const pendingEvents = await this.outboxRepository.findPending(MAX_RETRIES);
      if (pendingEvents.length === 0) return;

      this.logger.info(`Found ${pendingEvents.length} pending outbox events`);

      for (const event of pendingEvents) {
        await this.publishEvent(event);
      }
    } catch (error) {
      this.logger.error('Error polling outbox events', undefined, error as Error);
    }
  }

  private async publishEvent(event: OutboxEvent): Promise<void> {
    const channel = this.channel;
    if (!channel) {
      this.logger.error('Channel not available for publishing');
      return;
    }

    try {
      const payload = JSON.stringify(event.payload);
      const published = channel.publish(
        this.exchange,
        event.eventType,
        Buffer.from(payload),
        { persistent: true, messageId: event.id },
      );

      if (!published) {
        throw new Error('Channel write buffer is full');
      }

      event.markAsPublished();
      await this.outboxRepository.update(event);
      this.logger.info(`Published outbox event ${event.id} (${event.eventType})`);
    } catch (error) {
      this.logger.error(`Failed to publish outbox event ${event.id}`, { eventType: event.eventType }, error as Error);
      event.markAsFailed(error as Error, MAX_RETRIES);
      await this.outboxRepository.update(event);
    }
  }
}
