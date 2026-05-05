import { describe, it, expect } from 'bun:test';
import { FinishRoundUseCase } from '@/application/use-cases/finish-round.usecase';
import { FinishRoundCommand } from '@/application/commands/finish-round.command';
import { Round } from '@/domain/entities/round.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { RoundRepositoryImpl } from '@/infrastructure/repositories/round.repository.impl';

describe('FinishRoundUseCase', () => {
  it('finishes round and returns RoundResponseDto', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    round.start();
    round.crash();
    const repo = new RoundRepositoryImpl();
    repo.setCurrentRound(round);
    const useCase = new FinishRoundUseCase(repo);
    const cmd = new FinishRoundCommand();

    const result = await useCase.execute(cmd);

    expect(result).toBeDefined();
    expect(result.status).toBe(RoundStatus.FINISHED);
  });

  it('throws when round is not in CRASHED', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    const repo = new RoundRepositoryImpl();
    repo.setCurrentRound(round);
    const useCase = new FinishRoundUseCase(repo);
    const cmd = new FinishRoundCommand();

    expect(() => useCase.execute(cmd)).toThrow();
  });
});
