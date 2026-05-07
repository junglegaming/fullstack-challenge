import { describe, it, expect } from 'bun:test';
import { FinishRoundUseCase } from '@/application/use-cases/finish-round.usecase';
import { FinishRoundCommand } from '@/application/commands/finish-round.command';
import { Round } from '@/domain/entities/round.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';

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

describe('FinishRoundUseCase', () => {
  it('finishes round and returns RoundResponseDto', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    round.start();
    round.crash();
    const repo = new MockRoundRepository();
    repo.setCurrentRound(round);
    const useCase = new FinishRoundUseCase(repo);
    const cmd = new FinishRoundCommand();

    const result = await useCase.execute(cmd);

    expect(result).toBeDefined();
    expect(result.status).toBe(RoundStatus.FINISHED);
  });

  it('throws when round is not in CRASHED', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    const repo = new MockRoundRepository();
    repo.setCurrentRound(round);
    const useCase = new FinishRoundUseCase(repo);
    const cmd = new FinishRoundCommand();

    expect(() => useCase.execute(cmd)).toThrow();
  });
});
