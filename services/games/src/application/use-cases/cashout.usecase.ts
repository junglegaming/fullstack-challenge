import { EventBus } from '../../shared/event-bus';
import { RoundRepository } from "@/infrastructure/repositories/round.repository";

export class CashoutUseCase {
  constructor(
    private roundRepo: RoundRepository,
    private eventBus: EventBus,
  ) {}

  async execute(playerId: string) {
    const round = await this.roundRepo.getCurrent();

    const bet = round.bets.find(b => b.playerId === playerId);

    if (!bet) throw new Error('No bet found');

    bet.cashOut(round.currentMultiplier);

    await this.roundRepo.save(round);

    await this.eventBus.publish({
      type: 'cashout_requested',
      payload: {
        playerId,
        amount: bet.payout,
      },
    });

    return bet;
  }
}