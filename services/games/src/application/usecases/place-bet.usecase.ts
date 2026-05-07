import { Bet } from "../../domain/entities/bet.entity"
import { RabbitMQClient } from "../rabbitmq.client"
import { RoundService } from "../service/round.service"

export class PlaceBetUseCase {
  constructor(
    private readonly roundService: RoundService,
    private readonly rabbit: RabbitMQClient,
  ) {}

  async execute(
    playerId: string,
    amount: bigint,
  ) {
    const round = this.roundService.getCurrentRound()

    round.placeBet(
      new Bet(playerId, amount),
    )

    await this.rabbit.emitBetPlaced(
      playerId,
      amount,
    )

    return {
      success: true,
    }
  }
}