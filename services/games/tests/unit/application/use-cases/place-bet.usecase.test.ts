import { describe, it, expect } from 'bun:test';
import { PlaceBetUseCase } from '@/application/use-cases/place-bet.usecase';
import { PlaceBetCommand } from '@/application/commands/place-bet.command';
import { Round } from '@/domain/entities/round.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { IWebSocketEmitter } from '@/application/ports/websocket-emitter.port';
import { BetPlacedDto } from '@/presentation/dtos/bet-placed.dto';

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
  lastBetPlacedDto: BetPlacedDto | null = null;
  lastBetCashedOutDto: any = null;

  broadcastBetPlaced(dto: BetPlacedDto): void {
    this.lastBetPlacedDto = dto;
  }

  broadcastBetCashedOut(dto: any): void {
    this.lastBetCashedOutDto = dto;
  }
}

describe('PlaceBetUseCase', () => {
  it('places bet and returns BetResponseDto', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.BETTING, new Multiplier(2.0));
    const repo = new MockRoundRepository();
    repo.setCurrentRound(round);
    const emitter = new MockWebSocketEmitter();
    const useCase = new PlaceBetUseCase(repo, emitter);
    const cmd = new PlaceBetCommand(new PlayerId('player-1'), Money.fromReais(10));

    const result = await useCase.execute(cmd);

    expect(result).toBeDefined();
    expect(result.playerId).toBe('player-1');
    expect(result.status).toBe('ACTIVE');
    expect(emitter.lastBetPlacedDto).not.toBeNull();
    expect(emitter.lastBetPlacedDto?.playerId).toBe('player-1');
  });

  it('throws when round is not in BETTING', async () => {
    const round = new Round(new RoundId('round-1'), RoundStatus.RUNNING, new Multiplier(2.0));
    const repo = new MockRoundRepository();
    repo.setCurrentRound(round);
    const emitter = new MockWebSocketEmitter();
    const useCase = new PlaceBetUseCase(repo, emitter);
    const cmd = new PlaceBetCommand(new PlayerId('player-1'), Money.fromReais(10));

    expect(() => useCase.execute(cmd)).toThrow();
  });
});
