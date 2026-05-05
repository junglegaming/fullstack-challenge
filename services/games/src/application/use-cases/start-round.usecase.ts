import { RoundRepository } from '@/domain/repositories/round.repository';
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
    await this.roundRepo.save(round);

    return new RoundResponseDto(
      round.roundId.raw,
      round.roundStatus,
      round.roundCrashPoint.raw,
      round.multiplier.raw,
    );
  }
}
