import { describe, it, expect } from 'bun:test';
import { CrashRoundUseCase } from '@/application/use-cases/crash-round.usecase';
import { CrashRoundCommand } from '@/application/commands/crash-round.command';
import { Round } from '@/domain/entities/round.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { RoundRepositoryImpl } from '@/infrastructure/repositories/round.repository.impl';

describe('CrashRoundUseCase', () => {
  it('crashes round and returns RoundResponseDto', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    round.start();
    const repo = new RoundRepositoryImpl();
    repo.setCurrentRound(round);
    const useCase = new CrashRoundUseCase(repo);
    const cmd = new CrashRoundCommand();

    const result = await useCase.execute(cmd);

    expect(result).toBeDefined();
    expect(result.status).toBe(RoundStatus.CRASHED);
  });

  it('throws when round is not in RUNNING', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    const repo = new RoundRepositoryImpl();
    repo.setCurrentRound(round);
    const useCase = new CrashRoundUseCase(repo);
    const cmd = new CrashRoundCommand();

    expect(() => useCase.execute(cmd)).toThrow();
  });
});
