import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqp from "amqplib";
import { EXCHANGE } from "./contracts";

export type MessageHandler = (
  payload: unknown,
  routingKey: string,
) => Promise<void>;

@Injectable()
export class AmqpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AmqpService.name);
  private connection!: amqp.ChannelModel;
  private channel!: amqp.Channel;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {

    const url = this.config.getOrThrow<string>("RABBITMQ_URL");
    await this.connectWithRetry(url);

    await this.channel.assertExchange(EXCHANGE, "topic", { durable: true });
    this.logger.log(`Connected to RabbitMQ; exchange '${EXCHANGE}' ready`);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      this.logger.warn(`Error closing AMQP resources: ${String(error)}`);
    }
  }

  publish(routingKey: string, payload: unknown): void {
    const body = Buffer.from(JSON.stringify(payload));
    this.channel.publish(EXCHANGE, routingKey, body, { persistent: true });
  }

  async consume(
    queue: string,
    routingKeys: string[],
    handler: MessageHandler,
  ): Promise<void> {
    await this.channel.assertQueue(queue, { durable: true });
    for (const key of routingKeys) {
      await this.channel.bindQueue(queue, EXCHANGE, key);
    }

    await this.channel.prefetch(10);
    await this.channel.consume(queue, (message) => {
      if (!message) {
        return;
      }
      void this.handleMessage(queue, message, handler);
    });
    this.logger.log(`Consuming '${queue}' bound to [${routingKeys.join(", ")}]`);
  }

  private async handleMessage(
    queue: string,
    message: amqp.ConsumeMessage,
    handler: MessageHandler,
  ): Promise<void> {
    try {
      const payload = JSON.parse(message.content.toString());
      await handler(payload, message.fields.routingKey);

      this.channel.ack(message);
    } catch (error) {
      this.logger.error(
        `Handler failed for '${queue}' (${message.fields.routingKey}): ${String(error)}`,
      );

      this.channel.nack(message, false, false);
    }
  }

  private async connectWithRetry(url: string, attempts = 10): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        return;
      } catch (error) {
        this.logger.warn(
          `RabbitMQ connection attempt ${attempt}/${attempts} failed: ${String(error)}`,
        );
        if (attempt === attempts) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}
