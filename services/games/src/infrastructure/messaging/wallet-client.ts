import { Injectable } from "@nestjs/common";
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class WalletClient {
  private client: ClientProxy;

  constructor() {
    this.client = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || "amqp://localhost:5672"],
        queue: "wallet_queue",
      },
    });
  }

  async sendBetPlaced(userId: string, amount: bigint) {
    return firstValueFrom(
      this.client.send("bet_placed", {
        userId,
        amount: amount.toString(),
      }),
    );
  }

  async emitBetWon(userId: string, amount: bigint) {
    return this.client.emit("bet_won", {
      userId,
      amount: amount.toString(),
    });
  }
}
