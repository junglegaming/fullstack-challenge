import type { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { OutboxEventId } from '@/domain/value-objects/outbox-event-id.vo';
import { CrashRoundCommand } from '../commands/crash-round.command';
import { RoundResponseDto } from '../dtos/round.response.dto';
import { Injectable, Inject } from '@nestjs/common';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';

@Injectable()
export class CrashRoundUseCase {
  constructor(
    @Inject('RoundRepository') private readonly roundRepo: RoundRepository,
  ) {}

  async execute(_cmd: CrashRoundCommand): Promise<RoundResponseDto> {
    const round = await this.roundRepo.getCurrent();

    if (round.roundStatus !== 'RUNNING') {
      throw new InvalidStateTransitionError(round.roundStatus, 'CRASHED');
    }

    round.crash();

    const outboxEvent = new OutboxEvent(
      new OutboxEventId(`round-crashed-${round.roundId.raw}`),
      'Round',
      round.roundId.raw,
      'round-crashed',
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
