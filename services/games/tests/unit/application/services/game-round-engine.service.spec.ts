import { describe, expect, it } from "bun:test";
import type {
  GameRoundEngineConfig,
} from "../../../../src/application/config/game-round-engine.config";
import { GameRoundEngineService } from "../../../../src/application/services/game-round-engine.service";
import type { GameRealtimePublisher } from "../../../../src/application/ports/game-realtime.publisher";
import type {
  GameRoundsRepository,
  RoundHistoryPage,
} from "../../../../src/application/ports/game-rounds.repository";
import { Round } from "../../../../src/domain/entities/round";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";
import { Bet } from "../../../../src/domain/entities/bet";
import { Multiplier } from "../../../../src/domain/value-objects/multiplier";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { RoundId } from "../../../../src/domain/value-objects/round-id";
import { RoundStatus } from "../../../../src/domain/value-objects/round-status";

describe("GameRoundEngineService", () => {
  class FakeRealtimePublisher implements GameRealtimePublisher {
    readonly events: string[] = [];

    async publishRoundBettingStarted(): Promise<void> {
      this.events.push("round.betting_started");
    }

    async publishRoundStarted(): Promise<void> {
      this.events.push("round.started");
    }

    async publishRoundMultiplierTick(): Promise<void> {
      this.events.push("round.multiplier_tick");
    }

    async publishBetAccepted(): Promise<void> {
      this.events.push("bet.accepted");
    }

    async publishBetCashedOut(): Promise<void> {
      this.events.push("bet.cashed_out");
    }

    async publishRoundCrashed(): Promise<void> {
      this.events.push("round.crashed");
    }

    async publishRoundSettled(): Promise<void> {
      this.events.push("round.settled");
    }
  }

  class FakeGameRoundsRepository implements GameRoundsRepository {
    history: Round[] = [];
    savedRounds: Round[] = [];

    constructor(private currentRound: Round) {}

    async findCurrent(): Promise<Round> {
      return this.currentRound;
    }

    async findById(roundId: RoundId): Promise<Round | null> {
      return [this.currentRound, ...this.history].find((round) =>
        round.id.equals(roundId),
      ) ?? null;
    }

    async listHistory(input: {
      page: number;
      pageSize: number;
    }): Promise<RoundHistoryPage> {
      const start = (input.page - 1) * input.pageSize;

      return {
        items: this.history.slice(start, start + input.pageSize),
        total: this.history.length,
      };
    }

    async findBetsByPlayer(_playerId: PlayerId): Promise<Bet[]> {
      return [];
    }

    async save(round: Round): Promise<void> {
      this.savedRounds.push(round);
    }

    async archiveCurrentAndStart(nextRound: Round): Promise<void> {
      this.history.unshift(this.currentRound);
      this.currentRound = nextRound;
    }
  }

  const config: GameRoundEngineConfig = {
    bettingPhaseMs: 1000,
    settlementDelayMs: 500,
    tickIntervalMs: 50,
    multiplierGrowth: { growthBasisPointsPerSecond: 100 },
    autoStart: false,
  };

  function createBettingRound(baseTime: Date): Round {
    return Round.create({
      serverSeedHash: "hash",
      clientSeed: "client-seed",
      nonce: 1,
      crashPoint: Multiplier.fromBasisPoints(150),
      bettingStartedAt: baseTime,
      bettingEndsAt: new Date(baseTime.getTime() + config.bettingPhaseMs),
    });
  }

  it("starts, crashes, settles and rotates rounds automatically", async () => {
    const baseTime = new Date("2026-06-14T12:00:00.000Z");
    const repository = new FakeGameRoundsRepository(createBettingRound(baseTime));
    const realtimePublisher = new FakeRealtimePublisher();
    const engine = new GameRoundEngineService(
      repository,
      new ProvablyFairService(),
      config,
      realtimePublisher,
    );

    await engine.advance(new Date(baseTime.getTime() + 999));
    expect((await repository.findCurrent()).status).toBe(RoundStatus.BETTING);

    await engine.advance(new Date(baseTime.getTime() + 1000));
    expect((await repository.findCurrent()).status).toBe(RoundStatus.RUNNING);

    await engine.advance(new Date(baseTime.getTime() + 1250));
    expect((await repository.findCurrent()).status).toBe(RoundStatus.RUNNING);

    await engine.advance(new Date(baseTime.getTime() + 1500));
    const crashedRound = await repository.findCurrent();
    expect(crashedRound.status).toBe(RoundStatus.CRASHED);
    expect(crashedRound.crashedAt?.toISOString()).toBe(
      "2026-06-14T12:00:01.500Z",
    );

    await engine.advance(new Date(baseTime.getTime() + 1999));
    expect((await repository.findCurrent()).status).toBe(RoundStatus.CRASHED);

    await engine.advance(new Date(baseTime.getTime() + 2000));
    const settledRound = await repository.findCurrent();
    expect(settledRound.status).toBe(RoundStatus.SETTLED);

    await engine.advance(new Date(baseTime.getTime() + 2001));
    const nextRound = await repository.findCurrent();

    expect(nextRound.status).toBe(RoundStatus.BETTING);
    expect(nextRound.nonce).toBe(2);
    expect(repository.history[0]?.id.equals(settledRound.id)).toBe(true);
    expect(nextRound.bettingEndsAt.getTime() - nextRound.bettingStartedAt.getTime()).toBe(
      config.bettingPhaseMs,
    );
    expect(realtimePublisher.events).toEqual([
      "round.started",
      "round.multiplier_tick",
      "round.crashed",
      "round.settled",
      "round.betting_started",
    ]);
  });
});
