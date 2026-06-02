import { Injectable } from "@nestjs/common";
import { AmqpConnection } from "@golevelup/nestjs-rabbitmq";

const GAME_EXCHANGE = "game";

@Injectable()
export class GameEventsPublisher {
  constructor(private readonly amqp: AmqpConnection) {}

  async publishReserve(
    betId: string,
    playerId: string,
    amountCents: number,
  ): Promise<void> {
    await this.amqp.publish(GAME_EXCHANGE, "wallet.reserve", {
      reservationId: betId,
      playerId,
      amount: amountCents,
    });
  }

  async publishSettle(
    betId: string,
    playerId: string,
    outcome: "win" | "loss",
    payoutCents?: number,
  ): Promise<void> {
    await this.amqp.publish(GAME_EXCHANGE, "wallet.settle", {
      reservationId: betId,
      playerId,
      outcome,
      payout: payoutCents,
    });
  }
}
