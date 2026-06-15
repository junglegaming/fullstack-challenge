import { describe, expect, it } from "bun:test";
import type { GameRoundEngineConfig } from "../../../../src/application/config/game-round-engine.config";
import { GameRoundEngineService } from "../../../../src/application/services/game-round-engine.service";
import type { GameRealtimePublisher } from "../../../../src/application/ports/game-realtime.publisher";
import type {
  GameRoundsRepository,
  RoundHistoryPage,
} from "../../../../src/application/ports/game-rounds.repository";
import type { RoundStartedPayload } from "../../../../src/application/realtime/game-realtime-events";
import { Round } from "../../../../src/domain/entities/round";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";
import { Bet } from "../../../../src/domain/entities/bet";
import { Multiplier } from "../../../../src/domain/value-objects/multiplier";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { RoundId } from "../../../../src/domain/value-objects/round-id";

describe("GameRoundEngineService round.started payload", () => {
  class FakeRealtimePublisher implements GameRealtimePublisher {
    readonly startedPayloads: RoundStartedPayload[] = [];

    async publishRoundBettingStarted(): Promise<void> {}

    async publishRoundStarted(payload: RoundStartedPayload): Promise<void> {
      this.startedPayloads.push(payload);
    }

    async publishRoundMultiplierTick(): Promise<void> {}
    async publishBetAccepted(): Promise<void> {}
    async publishBetCashedOut(): Promise<void> {}
    async publishRoundCrashed(): Promise<void> {}
    async publishRoundSettled(): Promise<void> {}
  }

  class FakeGameRoundsRepository implements GameRoundsRepository {
    constructor(private currentRound: Round) {}

    async findCurrent(): Promise<Round> {
      return this.currentRound;
    }

    async findById(roundId: RoundId): Promise<Round | null> {
      return this.currentRound.id.equals(roundId) ? this.currentRound : null;
    }

    async listHistory(): Promise<RoundHistoryPage> {
      return { items: [], total: 0 };
    }

    async findBetsByPlayer(_playerId: PlayerId): Promise<Bet[]> {
      return [];
    }

    async save(): Promise<void> {}

    async archiveCurrentAndStart(nextRound: Round): Promise<void> {
      this.currentRound = nextRound;
    }
  }

  const config: GameRoundEngineConfig = {
    bettingPhaseMs: 1_000,
    settlementDelayMs: 500,
    tickIntervalMs: 50,
    multiplierGrowth: {
      growthBasisPointsPerSecond: 40,
      boostAfterGainedBasisPoints: 100,
      boostGrowthBasisPointsPerSecond: 2_000,
    },
    autoStart: false,
  };

  it("includes multiplier sync parameters required by the frontend", async () => {
    const baseTime = new Date("2026-06-14T12:00:00.000Z");
    const round = Round.create({
      serverSeedHash: "hash",
      clientSeed: "client-seed",
      nonce: 1,
      crashPoint: Multiplier.fromBasisPoints(500),
      bettingStartedAt: baseTime,
      bettingEndsAt: new Date(baseTime.getTime() + config.bettingPhaseMs),
    });
    const repository = new FakeGameRoundsRepository(round);
    const realtimePublisher = new FakeRealtimePublisher();
    const engine = new GameRoundEngineService(
      repository,
      new ProvablyFairService(),
      config,
      realtimePublisher,
    );

    const startedAt = new Date(baseTime.getTime() + config.bettingPhaseMs);
    await engine.advance(startedAt);

    expect(realtimePublisher.startedPayloads).toHaveLength(1);
    expect(realtimePublisher.startedPayloads[0]).toEqual({
      roundId: round.id.toString(),
      startedAt: startedAt.toISOString(),
      serverTime: startedAt.toISOString(),
      serverSeedHash: round.serverSeedHash,
      baseMultiplier: "1.00",
      multiplierGrowth: {
        growthBasisPointsPerSecond: 40,
        boostAfterGainedBasisPoints: 100,
        boostGrowthBasisPointsPerSecond: 2_000,
      },
    });
  });
});
