import { Injectable, Logger } from "@nestjs/common";
import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { GameLoop } from "../../application/game-loop";
import { TypeOrmGameRepository } from "../persistence/typeorm-game.repository";
import { GameGateway } from "../../presentation/gateways/game.gateway";

interface ReservedMessage {
  reservationId: string;
  playerId: string;
  availableBalance: number;
}

interface RejectedMessage {
  reservationId: string;
  playerId: string;
  reason: string;
}

interface SettledMessage {
  reservationId: string;
  playerId: string;
  availableBalance: number;
}

@Injectable()
export class WalletEventsConsumer {
  private readonly logger = new Logger(WalletEventsConsumer.name);

  constructor(
    private readonly gameLoop: GameLoop,
    private readonly repository: TypeOrmGameRepository,
    private readonly gateway: GameGateway,
  ) {}

  @RabbitSubscribe({
    exchange: "wallet",
    routingKey: "wallet.reserved",
    queue: "games.reserved",
    queueOptions: { durable: true },
  })
  async handleReserved(msg: ReservedMessage): Promise<void> {
    const { reservationId, playerId } = msg;
    const round = this.gameLoop.getCurrentRound();
    if (!round) {
      this.logger.warn(`wallet.reserved for bet ${reservationId}: no active round`);
      return;
    }

    const bet = round.bets.get(playerId);
    if (!bet || bet.id !== reservationId) {
      // Round may have already crashed (edge case) — funds stay reserved until
      // the compensation job releases them (TODO: add scheduled compensation).
      this.logger.warn(`wallet.reserved for bet ${reservationId}: not found in current round`);
      return;
    }

    await this.repository.saveRound(round);
    await this.repository.saveBet(bet, round.id);
    this.gateway.emitBetPlaced(round.id, playerId, bet.amount.cents);
  }

  @RabbitSubscribe({
    exchange: "wallet",
    routingKey: "wallet.rejected",
    queue: "games.rejected",
    queueOptions: { durable: true },
  })
  async handleRejected(msg: RejectedMessage): Promise<void> {
    const { playerId } = msg;
    this.gameLoop.cancelBet(playerId);
    // TODO: emit bet.rejected WebSocket event so the frontend shows feedback
  }

  @RabbitSubscribe({
    exchange: "wallet",
    routingKey: "wallet.settled",
    queue: "games.settled",
    queueOptions: { durable: true },
  })
  async handleSettled(msg: SettledMessage): Promise<void> {
    const { playerId, availableBalance } = msg;
    this.gateway.emitSettled(playerId, availableBalance);
  }
}
