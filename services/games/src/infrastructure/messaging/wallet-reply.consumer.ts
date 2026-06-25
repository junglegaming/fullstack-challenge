import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { GameEngine } from "../../application/game-engine.service";
import { AmqpService } from "./amqp.service";
import { RoutingKeys } from "./contracts";
import type { DebitFailedEvent, DebitSucceededEvent } from "./contracts";

const QUEUE = "game.wallet-replies";

@Injectable()
export class WalletReplyConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(WalletReplyConsumer.name);

  constructor(
    private readonly amqp: AmqpService,
    private readonly engine: GameEngine,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.amqp.consume(
      QUEUE,
      [
        RoutingKeys.DebitSucceeded,
        RoutingKeys.DebitFailed,
        RoutingKeys.CreditSucceeded,
      ],
      (payload, routingKey) => this.route(payload, routingKey),
    );
  }

  private async route(payload: unknown, routingKey: string): Promise<void> {
    switch (routingKey) {
      case RoutingKeys.DebitSucceeded: {
        const event = payload as DebitSucceededEvent;
        return this.engine.onDebitSucceeded(event.roundId, event.betId);
      }
      case RoutingKeys.DebitFailed: {
        const event = payload as DebitFailedEvent;
        return this.engine.onDebitFailed(event.roundId, event.betId);
      }
      case RoutingKeys.CreditSucceeded:

        return;
      default:

        this.logger.warn(`Ignoring unexpected routing key '${routingKey}'`);
    }
  }
}
