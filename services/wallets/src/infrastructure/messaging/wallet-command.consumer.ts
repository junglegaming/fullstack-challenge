import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { CreditWalletUseCase } from "../../application/use-cases/credit-wallet.use-case";
import { DebitWalletUseCase } from "../../application/use-cases/debit-wallet.use-case";
import { AmqpService } from "./amqp.service";
import { RoutingKeys } from "./contracts";
import type {
  CreditRequestedEvent,
  CreditSucceededEvent,
  DebitFailedEvent,
  DebitRequestedEvent,
  DebitSucceededEvent,
} from "./contracts";

const QUEUE = "wallet.commands";

@Injectable()
export class WalletCommandConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(WalletCommandConsumer.name);

  constructor(
    private readonly amqp: AmqpService,
    private readonly debitWallet: DebitWalletUseCase,
    private readonly creditWallet: CreditWalletUseCase,
  ) {}

  async onApplicationBootstrap(): Promise<void> {

    await this.amqp.consume(
      QUEUE,
      [RoutingKeys.DebitRequested, RoutingKeys.CreditRequested],
      (payload, routingKey) => this.route(payload, routingKey),
    );
  }

  private async route(payload: unknown, routingKey: string): Promise<void> {
    switch (routingKey) {
      case RoutingKeys.DebitRequested:
        return this.handleDebit(payload as DebitRequestedEvent);
      case RoutingKeys.CreditRequested:
        return this.handleCredit(payload as CreditRequestedEvent);
      default:
        this.logger.warn(`Ignoring unexpected routing key '${routingKey}'`);
    }
  }

  private async handleDebit(event: DebitRequestedEvent): Promise<void> {

    const result = await this.debitWallet.execute({
      playerId: event.playerId,
      amountCents: event.amountCents,
      reference: `debit:${event.betId}`,
    });

    if (result.status === "SUCCEEDED") {
      const reply: DebitSucceededEvent = {
        betId: event.betId,
        roundId: event.roundId,
        playerId: event.playerId,
        balanceCents: result.balanceCents,
      };
      this.amqp.publish(RoutingKeys.DebitSucceeded, reply);
    } else {
      const reply: DebitFailedEvent = {
        betId: event.betId,
        roundId: event.roundId,
        playerId: event.playerId,
        reason: result.reason,
      };
      this.amqp.publish(RoutingKeys.DebitFailed, reply);
    }
  }

  private async handleCredit(event: CreditRequestedEvent): Promise<void> {

    const result = await this.creditWallet.execute({
      playerId: event.playerId,
      amountCents: event.amountCents,
      reference: `credit:${event.betId}`,
    });
    const reply: CreditSucceededEvent = {
      betId: event.betId,
      roundId: event.roundId,
      playerId: event.playerId,
      balanceCents: result.balanceCents,
    };
    this.amqp.publish(RoutingKeys.CreditSucceeded, reply);
  }
}
