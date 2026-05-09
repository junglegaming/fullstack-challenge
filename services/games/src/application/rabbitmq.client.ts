import { Inject, Injectable } from "@nestjs/common"
import { ClientProxy } from "@nestjs/microservices"

@Injectable()
export class RabbitMQClient {
  constructor(
    @Inject('WALLET_SERVICE')
    private client: ClientProxy,
  ) {}

  async emitBetPlaced(
    playerId: string,
    amount: bigint,
  ) {
    this.client.emit('bet_placed', {
      playerId,
      amount: amount.toString(),
    })
  }

  async emitCashout(
    playerId: string,
    amount: bigint,
  ) {
    this.client.emit('cashout_done', {
      playerId,
      amount: amount.toString(),
    })
  }
}