import { describe, it, expect } from 'bun:test';
import { StartRoundUseCase } from '@/application/use-cases/start-round.usecase';
import { StartRoundCommand } from '@/application/commands/start-round.command';
import { Round } from '@/domain/entities/round.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { RoundRepositoryImpl } from '@/infrastructure/repositories/round.repository.impl';

describe('StartRoundUseCase', () => {
  it('starts round and returns RoundResponseDto', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    const repo = new RoundRepositoryImpl();
    repo.setCurrentRound(round);
    const useCase = new StartRoundUseCase(repo);
    const cmd = new StartRoundCommand();

    const result = await useCase.execute(cmd);

    expect(result).toBeDefined();
    expect(result.status).toBe(RoundStatus.RUNNING);
  });

  it('throws when round is not in BETTING', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.RUNNING, new Multiplier(2.0));
    const repo = new RoundRepositoryImpl();
    repo.setCurrentRound(round);
    const useCase = new StartRoundUseCase(repo);
    const cmd = new StartRoundCommand();

    expect(() => useCase.execute(cmd)).toThrow();
  });
});
