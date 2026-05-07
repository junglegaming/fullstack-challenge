import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { RabbitMQConsumer } from './consumer';
import { StructuredLogger } from '../logger/structured-logger';

@Injectable()
export class RabbitMQService implements OnModuleDestroy {
  private consumer: RabbitMQConsumer;
  private logger: StructuredLogger;
  private started = false;

  constructor() {
    const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const exchange = process.env.RABBITMQ_EXCHANGE || 'game_events';
    this.logger = new StructuredLogger('wallet-rabbitmq-service');
    this.consumer = new RabbitMQConsumer(rabbitUrl, exchange, 'wallet_service');
  }

  getConsumer(): RabbitMQConsumer {
    return this.consumer;
  }

  async startConsumer(): Promise<void> {
    if (this.started) return;
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.consumer.start();
        this.started = true;
        this.logger.info('RabbitMQ consumer started');
        return;
      } catch (error) {
        this.logger.error(`Failed to start RabbitMQ consumer (attempt ${attempt}/${maxRetries})`, undefined, error as Error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.started) {
      await this.consumer.stop();
      this.logger.info('RabbitMQ consumer destroyed');
    }
  }
}
