import { Inject, Injectable, Optional } from "@nestjs/common";
import {
  GAME_ROUND_ENGINE_CONFIG,
  type GameRoundEngineConfig,
} from "../../application/config/game-round-engine.config";
import type {
  GameRoundsRepository,
  RoundHistoryPage,
} from "../../application/ports/game-rounds.repository";
import { DEFAULT_CLIENT_SEED, PROVABLY_FAIR_TEST_FIXTURE } from "../../domain/constants/provably-fair";
import { Bet } from "../../domain/entities/bet";
import { Round } from "../../domain/entities/round";
import { ProvablyFairService } from "../../domain/services/provably-fair.service";
import { PlayerId } from "../../domain/value-objects/player-id";
import { RoundId } from "../../domain/value-objects/round-id";

/**
 * Temporary in-memory repository for the API slice.
 * Replace with Prisma persistence plus RabbitMQ handlers before the final gameplay flow.
 */
@Injectable()
export class InMemoryGameRoundsRepository implements GameRoundsRepository {
  private currentRound: Round;
  private readonly history: Round[];

  constructor(
    private readonly provablyFairService: ProvablyFairService,
    @Optional()
    @Inject(GAME_ROUND_ENGINE_CONFIG)
    private readonly config?: GameRoundEngineConfig,
  ) {
    this.currentRound = this.createCurrentRound();
    this.history = [this.createSettledHistoryRound()];
  }

  async findCurrent(): Promise<Round> {
    return this.currentRound;
  }

  async findById(roundId: RoundId): Promise<Round | null> {
    const rounds = [this.currentRound, ...this.history];
    return rounds.find((round) => round.id.equals(roundId)) ?? null;
  }

  async listHistory(input: { page: number; pageSize: number }): Promise<RoundHistoryPage> {
    const start = (input.page - 1) * input.pageSize;

    return {
      items: this.history.slice(start, start + input.pageSize),
      total: this.history.length,
    };
  }

  async findBetsByPlayer(playerId: PlayerId): Promise<Bet[]> {
    return [this.currentRound, ...this.history].flatMap((round) =>
      round.bets.filter((bet) => bet.playerId.equals(playerId)),
    );
  }

  async save(_round: Round): Promise<void> {
    // Rounds are mutable domain objects in this temporary repository.
  }

  async archiveCurrentAndStart(nextRound: Round): Promise<void> {
    this.history.unshift(this.currentRound);
    this.currentRound = nextRound;
  }

  private createCurrentRound(): Round {
    const now = new Date();

    return Round.createProvablyFair({
      provablyFairService: this.provablyFairService,
      clientSeed: DEFAULT_CLIENT_SEED,
      nonce: 1,
      bettingStartedAt: now,
      bettingEndsAt: new Date(now.getTime() + this.getBettingPhaseMs()),
    });
  }

  private getBettingPhaseMs(): number {
    return this.config?.bettingPhaseMs ?? 10_000;
  }

  private createSettledHistoryRound(): Round {
    const round = Round.createProvablyFair({
      provablyFairService: this.provablyFairService,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
      bettingStartedAt: new Date("2026-06-14T12:00:00.000Z"),
      bettingEndsAt: new Date("2026-06-14T12:00:10.000Z"),
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
    });

    round.start(new Date("2026-06-14T12:00:11.000Z"));
    round.crash(new Date("2026-06-14T12:00:20.000Z"));
    round.settle(new Date("2026-06-14T12:00:21.000Z"));

    return round;
  }
}
