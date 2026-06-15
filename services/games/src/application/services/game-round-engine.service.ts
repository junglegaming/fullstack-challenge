import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  DEFAULT_CLIENT_SEED,
} from "../../domain/constants/provably-fair";
import { Round } from "../../domain/entities/round";
import { ProvablyFairService } from "../../domain/services/provably-fair.service";
import { RoundStatus } from "../../domain/value-objects/round-status";
import {
  GAME_ROUND_ENGINE_CONFIG,
  type GameRoundEngineConfig,
} from "../config/game-round-engine.config";
import {
  GAME_ROUNDS_REPOSITORY,
  type GameRoundsRepository,
} from "../ports/game-rounds.repository";

@Injectable()
export class GameRoundEngineService implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(GAME_ROUNDS_REPOSITORY)
    private readonly roundsRepository: GameRoundsRepository,
    private readonly provablyFairService: ProvablyFairService,
    @Inject(GAME_ROUND_ENGINE_CONFIG)
    private readonly config: GameRoundEngineConfig,
  ) {}

  onModuleInit(): void {
    if (!this.config.autoStart) {
      return;
    }

    this.timer = setInterval(() => {
      void this.advance(new Date());
    }, this.config.tickIntervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async advance(now: Date): Promise<void> {
    const round = await this.roundsRepository.findCurrent();

    if (round.status === RoundStatus.BETTING) {
      await this.startRoundIfBettingClosed(round, now);
      return;
    }

    if (round.status === RoundStatus.RUNNING) {
      await this.crashRoundIfNeeded(round, now);
      return;
    }

    if (round.status === RoundStatus.CRASHED) {
      await this.settleRoundIfReady(round, now);
      return;
    }

    if (round.status === RoundStatus.SETTLED) {
      await this.startNextRound(round, now);
    }
  }

  createNextRound(now: Date, nonce: number): Round {
    return Round.createProvablyFair({
      provablyFairService: this.provablyFairService,
      clientSeed: DEFAULT_CLIENT_SEED,
      nonce,
      bettingStartedAt: now,
      bettingEndsAt: new Date(now.getTime() + this.config.bettingPhaseMs),
    });
  }

  private async startRoundIfBettingClosed(
    round: Round,
    now: Date,
  ): Promise<void> {
    if (now.getTime() < round.bettingEndsAt.getTime()) {
      return;
    }

    round.start(now);
    await this.roundsRepository.save(round);
  }

  private async crashRoundIfNeeded(round: Round, now: Date): Promise<void> {
    const currentMultiplier = round.getCurrentMultiplier(now, {
      growthBasisPointsPerSecond:
        this.config.multiplierGrowthBasisPointsPerSecond,
    });

    if (!currentMultiplier.equals(round.crashPoint)) {
      return;
    }

    round.crash(now);
    await this.roundsRepository.save(round);
  }

  private async settleRoundIfReady(round: Round, now: Date): Promise<void> {
    const crashedAt = round.crashedAt;

    if (!crashedAt) {
      return;
    }

    if (now.getTime() - crashedAt.getTime() < this.config.settlementDelayMs) {
      return;
    }

    round.settle(now);
    await this.roundsRepository.save(round);
  }

  private async startNextRound(round: Round, now: Date): Promise<void> {
    const nextRound = this.createNextRound(now, round.nonce + 1);
    await this.roundsRepository.archiveCurrentAndStart(nextRound);
  }
}
