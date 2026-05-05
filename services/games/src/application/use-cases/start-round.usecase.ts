import { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { OutboxEventId } from '@/domain/value-objects/outbox-event-id.vo';
import { StartRoundCommand } from '../commands/start-round.command';
import { RoundResponseDto } from '../dtos/round.response.dto';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';

export class StartRoundUseCase {
  constructor(
    private readonly roundRepo: RoundRepository,
  ) {}

  async execute(_cmd: StartRoundCommand): Promise<RoundResponseDto> {
    const round = await this.roundRepo.getCurrent();

    if (round.roundStatus !== 'BETTING') {
      throw new InvalidStateTransitionError(round.roundStatus, 'RUNNING');
    }

    round.start();

    const outboxEvent = new OutboxEvent(
      new OutboxEventId(`round-started-${round.roundId.raw}`),
      'Round',
      round.roundId.raw,
      'round_started',
      {
        roundId: round.roundId.raw,
        status: round.roundStatus,
        crashPoint: round.roundCrashPoint.raw,
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
