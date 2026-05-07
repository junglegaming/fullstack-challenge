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
import { RoundRepository } from '@/domain/repositories/round.repository';
import { IWebSocketEmitter } from '@/application/ports/websocket-emitter.port';
import { BetCashedOutDto } from '@/presentation/dtos/bet-cashed-out.dto';

class MockRoundRepository implements RoundRepository {
  private currentRound: Round | null = null;

  async getCurrent(): Promise<Round> {
    if (!this.currentRound) throw new Error('No round');
    return this.currentRound;
  }

  async save(round: Round, events?: OutboxEvent[]): Promise<void> {
    this.currentRound = round;
  }

  async findPendingOutboxEvents(limit: number): Promise<OutboxEvent[]> {
    return [];
  }

  async markOutboxEventAsPublished(eventId: string): Promise<void> {}
  async incrementOutboxEventFailedAttempts(eventId: string): Promise<void> {}

  setCurrentRound(round: Round): void {
    this.currentRound = round;
  }
}

class MockWebSocketEmitter implements IWebSocketEmitter {
  lastBetCashedOutDto: BetCashedOutDto | null = null;

  broadcastBetPlaced(dto: any): void {}
  broadcastBetCashedOut(dto: BetCashedOutDto): void {
    this.lastBetCashedOutDto = dto;
  }
  broadcastRoundStarted(dto: any): void {}
  broadcastMultiplierUpdate(dto: any): void {}
  broadcastRoundCrashed(dto: any): void {}
}

describe('CashoutUseCase', () => {
  it('cashout bet and returns BetResponseDto', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    const playerId = new PlayerId('player-1');
    const betId = new BetId('bet-1');
    round.placeBet(betId, playerId, Money.fromReais(10));
    round.start();
    round.updateMultiplier(new Multiplier(1.5));
    const repo = new MockRoundRepository();
    repo.setCurrentRound(round);
    const emitter = new MockWebSocketEmitter();
    const useCase = new CashoutUseCase(repo, emitter);
    const cmd = new CashoutCommand(playerId);

    const result = await useCase.execute(cmd);

    expect(result).toBeDefined();
    expect(result.status).toBe('CASHED_OUT');
    expect(emitter.lastBetCashedOutDto).not.toBeNull();
  });

  it('throws when round is not in RUNNING', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    const repo = new MockRoundRepository();
    repo.setCurrentRound(round);
    const emitter = new MockWebSocketEmitter();
    const useCase = new CashoutUseCase(repo, emitter);
    const cmd = new CashoutCommand(new PlayerId('player-1'));

    expect(() => useCase.execute(cmd)).toThrow();
  });
});
