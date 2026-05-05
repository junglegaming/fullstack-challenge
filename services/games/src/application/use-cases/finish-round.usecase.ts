import { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { OutboxEventId } from '@/domain/value-objects/outbox-event-id.vo';
import { FinishRoundCommand } from '../commands/finish-round.command';
import { RoundResponseDto } from '../dtos/round.response.dto';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';

export class FinishRoundUseCase {
  constructor(
    private readonly roundRepo: RoundRepository,
  ) {}

  async execute(_cmd: FinishRoundCommand): Promise<RoundResponseDto> {
    const round = await this.roundRepo.getCurrent();

    if (round.roundStatus !== 'CRASHED') {
      throw new InvalidStateTransitionError(round.roundStatus, 'FINISHED');
    }

    round.finish();

    const allBets = round.roundBets.map(b => ({
      betId: b.betId.raw,
      playerId: b.player.raw,
      status: b.betStatus,
      amountCents: Number(b.betAmount.amount),
      payoutCents: Number(b.payout.amount),
    }));

    const outboxEvent = new OutboxEvent(
      new OutboxEventId(`round-finished-${round.roundId.raw}`),
      'Round',
      round.roundId.raw,
      'round_finished',
      {
        roundId: round.roundId.raw,
        status: round.roundStatus,
        allBets,
      },
    );

    await this.roundRepo.save(round, [outboxEvent]);

    return new RoundResponseDto(
      round.roundId.raw,
      round.roundStatus,
      round.roundCrashPoint.raw,
      round.multiplier.raw,
    );
  }
}
