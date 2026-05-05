import { RoundRepository } from '@/domain/repositories/round.repository';
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
    await this.roundRepo.save(round);

    return new RoundResponseDto(
      round.roundId.raw,
      round.roundStatus,
      round.roundCrashPoint.raw,
      round.multiplier.raw,
    );
  }
}
