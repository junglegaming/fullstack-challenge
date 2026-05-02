import { Bet } from "@/domain/entities/bet.entity";
import { RoundRepository } from "@/infrastructure/repositories/round.repository";
import { EventBus } from "@/shared/event-bus";

export class PlaceBetUseCase {
  constructor(
    private roundRepo: RoundRepository,
    private eventBus: EventBus,
  ) {}

  async execute(playerId: string, amount: number) {
    const round = await this.roundRepo.getCurrent();

    const bet = new Bet(
      crypto.randomUUID(),
      playerId,
      amount,
    );

    round.placeBet(bet);

    await this.roundRepo.save(round);

    // envia evento pro Wallet
    await this.eventBus.publish({
      type: 'bet_requested',
      payload: { playerId, amount },
    });

    return bet;
  }
}