import { Injectable, Logger } from "@nestjs/common";
import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";
import { ReserveWalletUseCase } from "@/application/reserve-wallet.use-case";
import { SettleWalletUseCase } from "@/application/settle-wallet.use-case";
import { WalletPublisher } from "./wallet.publisher";

interface ReserveMessage {
  reservationId: string;
  playerId: string;
  amount: number;
}

interface SettleMessage {
  reservationId: string;
  playerId: string;
  outcome: "win" | "loss";
  payout?: number;
}

@Injectable()
export class WalletEventsConsumer {
  private readonly logger = new Logger(WalletEventsConsumer.name);

  constructor(
    private readonly reserveUseCase: ReserveWalletUseCase,
    private readonly settleUseCase: SettleWalletUseCase,
    private readonly publisher: WalletPublisher,
  ) {}

  @RabbitSubscribe({
    exchange: "game",
    routingKey: "wallet.reserve",
    queue: "wallets.reserve",
    queueOptions: { durable: true },
  })
  async handleReserve(msg: ReserveMessage): Promise<void> {
    const { reservationId, playerId, amount } = msg;
    const result = await this.reserveUseCase.execute(
      reservationId,
      playerId,
      amount,
    );

    if (result.outcome === "duplicate") {
      this.logger.warn(`Duplicate reserve ignored: ${reservationId}`);
      return;
    }

    if (result.outcome === "rejected") {
      await this.publisher.publishRejected(
        reservationId,
        playerId,
        result.reason,
      );
      return;
    }

    await this.publisher.publishReserved(
      reservationId,
      playerId,
      result.availableBalance,
    );
  }

  @RabbitSubscribe({
    exchange: "game",
    routingKey: "wallet.settle",
    queue: "wallets.settle",
    queueOptions: { durable: true },
  })
  async handleSettle(msg: SettleMessage): Promise<void> {
    const { reservationId, playerId, outcome, payout } = msg;
    const result = await this.settleUseCase.execute(
      reservationId,
      playerId,
      outcome,
      payout,
    );

    if (result.outcome === "not_found") {
      this.logger.warn(
        `Settle for unknown reservation ignored: ${reservationId}`,
      );
      return;
    }

    await this.publisher.publishSettled(
      reservationId,
      playerId,
      result.availableBalance,
    );
  }
}

// TODO: Compensação por timeout — reservas pendentes além da duração de um round
// devem ser liberadas de volta para `availableBalance`. Seria implementado como
// um job agendado (ex: a cada 60s) que busca reservas com `createdAt` mais antigas
// que a duração máxima de um round e chama wallet.releaseReservation() para cada uma.
// Requer adicionar `createdAt` na tabela wallet_reservations.
