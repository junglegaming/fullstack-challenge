import { Injectable } from "@nestjs/common";
import { AmqpConnection } from "@golevelup/nestjs-rabbitmq";

const WALLET_EXCHANGE = "wallet";

@Injectable()
export class WalletPublisher {
  constructor(private readonly amqp: AmqpConnection) {}

  async publishReserved(
    reservationId: string,
    playerId: string,
    availableBalance: number,
  ): Promise<void> {
    await this.amqp.publish(WALLET_EXCHANGE, "wallet.reserved", {
      reservationId,
      playerId,
      availableBalance,
    });
  }

  async publishRejected(
    reservationId: string,
    playerId: string,
    reason: "insufficient_funds",
  ): Promise<void> {
    await this.amqp.publish(WALLET_EXCHANGE, "wallet.rejected", {
      reservationId,
      playerId,
      reason,
    });
  }

  async publishSettled(
    reservationId: string,
    playerId: string,
    availableBalance: number,
  ): Promise<void> {
    await this.amqp.publish(WALLET_EXCHANGE, "wallet.settled", {
      reservationId,
      playerId,
      availableBalance,
    });
  }
}
