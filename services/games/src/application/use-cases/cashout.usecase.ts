import { RoundRepository } from '@/domain/repositories/round.repository';
import { IEventBus } from '@/domain/application/ports/event-bus.port';
import { CashoutCommand } from '../commands/cashout.command';
import { BetResponseDto } from '../dtos/bet.response.dto';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';

export class CashoutUseCase {
  constructor(
    private readonly roundRepo: RoundRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(cmd: CashoutCommand): Promise<BetResponseDto> {
    const round = await this.roundRepo.getCurrent();

    if (round.roundStatus !== 'RUNNING') {
      throw new InvalidStateTransitionError(round.roundStatus, 'RUNNING');
    }

    const bet = round.cashOut(cmd.playerId);

    await this.roundRepo.save(round);

    await this.eventBus.publish({
      type: 'cashout_requested',
      payload: {
        playerId: cmd.playerId.raw,
        amount: Number(bet.payout.amount),
      },
    });

    return new BetResponseDto(
      bet.betId.raw,
      bet.player.raw,
      bet.betAmount.amount,
      bet.betStatus,
      bet.cashoutMultiplierValue?.raw ?? null,
      bet.payout.amount,
    );
  }
}
