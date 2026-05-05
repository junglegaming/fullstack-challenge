import { describe, it, expect } from 'bun:test';
import { CashoutUseCase } from '@/application/use-cases/cashout.usecase';
import { CashoutCommand } from '@/application/commands/cashout.command';
import { Round } from '@/domain/entities/round.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { BetId } from '@/domain/value-objects/bet-id.vo';
import { RoundRepositoryImpl } from '@/infrastructure/repositories/round.repository.impl';
import { EventBus } from '@/shared/event-bus';

describe('CashoutUseCase', () => {
  it('cashout bet and returns BetResponseDto', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    round.placeBet(new BetId('bet-1'), new PlayerId('player-1'), Money.fromReais(10));
    round.start();
    const repo = new RoundRepositoryImpl();
    repo.setCurrentRound(round);
    const eventBus = new EventBus();
    const useCase = new CashoutUseCase(repo, eventBus);
    const cmd = new CashoutCommand(new PlayerId('player-1'));

    const result = await useCase.execute(cmd);

    expect(result).toBeDefined();
    expect(result.status).toBe('CASHED_OUT');
  });

  it('throws when round is not in RUNNING', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    const repo = new RoundRepositoryImpl();
    repo.setCurrentRound(round);
    const eventBus = new EventBus();
    const useCase = new CashoutUseCase(repo, eventBus);
    const cmd = new CashoutCommand(new PlayerId('player-1'));

    expect(() => useCase.execute(cmd)).toThrow();
  });
});
