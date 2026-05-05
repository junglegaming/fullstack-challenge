import { RoundRepository } from '@/domain/repositories/round.repository';
import { IEventBus } from '@/application/ports/event-bus.port';
import { PlaceBetCommand } from '../commands/place-bet.command';
import { BetResponseDto } from '../dtos/bet.response.dto';
import { BetId } from '@/domain/value-objects/bet-id.vo';
import { Bet } from '@/domain/entities/bet.entity';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';

export class PlaceBetUseCase {
  constructor(
    private readonly roundRepo: RoundRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(cmd: PlaceBetCommand): Promise<BetResponseDto> {
    const round = await this.roundRepo.getCurrent();

    if (round.roundStatus !== 'BETTING') {
      throw new InvalidStateTransitionError(round.roundStatus, 'BETTING');
    }

    const bet = round.placeBet(
      new BetId(crypto.randomUUID()),
      cmd.playerId,
      cmd.amount,
    );

    await this.roundRepo.save(round);

    await this.eventBus.publish({
      type: 'bet_requested',
      payload: {
        playerId: cmd.playerId.raw,
        amount: Number(cmd.amount.amount),
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
