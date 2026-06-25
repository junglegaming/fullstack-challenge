import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from "@nestjs/common";
import { Bet } from "../domain/entities/bet.entity";
import { Round } from "../domain/entities/round.aggregate";
import { RoundStatus } from "../domain/entities/round-status";
import { NoActiveRoundError } from "../domain/errors/game.errors";
import { crashElapsedMs, multiplierValueAt } from "../domain/services/curve";
import { crashPointHundredths } from "../domain/services/provably-fair";
import { Money } from "../domain/value-objects/money.vo";
import { Multiplier } from "../domain/value-objects/multiplier.vo";
import { GameConfig } from "./game-config";
import { GameEventType } from "./events/game-events";
import { toBetSnapshot } from "./mappers/bet-snapshot.mapper";
import { GAME_EVENTS_PUBLISHER } from "./ports/game-events.publisher";
import type { GameEventsPublisher } from "./ports/game-events.publisher";
import { ID_GENERATOR } from "./ports/id-generator";
import type { IdGenerator } from "./ports/id-generator";
import { ROUND_REPOSITORY } from "./ports/round.repository";
import type { RoundRepository } from "./ports/round.repository";
import { SEED_CHAIN_PROVIDER } from "./ports/seed-chain.provider";
import type { SeedChainProvider } from "./ports/seed-chain.provider";
import { WALLET_GATEWAY } from "./ports/wallet.gateway";
import type { WalletGateway } from "./ports/wallet.gateway";

@Injectable()
export class GameEngine implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(GameEngine.name);

  private currentRound: Round | null = null;

  private roundStartedAtMs = 0;
  private running = false;

  constructor(
    private readonly config: GameConfig,
    @Inject(ROUND_REPOSITORY) private readonly rounds: RoundRepository,
    @Inject(SEED_CHAIN_PROVIDER) private readonly seeds: SeedChainProvider,
    @Inject(WALLET_GATEWAY) private readonly wallet: WalletGateway,
    @Inject(GAME_EVENTS_PUBLISHER)
    private readonly events: GameEventsPublisher,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seeds.ensureInitialized();
    const maxNonce = await this.rounds.findMaxNonce();
    const startNonce = maxNonce === null ? 0 : maxNonce + 1;
    this.running = true;

    void this.runLoop(startNonce);
  }

  onModuleDestroy(): void {
    this.running = false;
  }

  getCurrentRound(): Round | null {
    return this.currentRound;
  }

  getLiveMultiplier(): Multiplier {
    if (!this.currentRound || this.currentRound.getStatus() !== RoundStatus.RUNNING) {
      return Multiplier.one();
    }
    return this.multiplierAtNow();
  }

  async placeBet(params: {
    playerId: string;
    username: string;
    amount: Money;
  }): Promise<Bet> {
    const round = this.requireCurrentRound();

    const bet = round.placeBet({
      betId: this.ids.generate(),
      playerId: params.playerId,
      username: params.username,
      amount: params.amount,
      limits: {
        minCents: this.config.minBetCents,
        maxCents: this.config.maxBetCents,
      },
      now: new Date(),
    });
    await this.rounds.save(round);

    this.wallet.requestDebit({
      betId: bet.id,
      roundId: round.id,
      playerId: bet.playerId,
      amountCents: bet.amount.toCents().toString(),
    });

    this.events.publish({ type: GameEventType.BetPlaced, bet: toBetSnapshot(bet) });
    return bet;
  }

  async cashOut(playerId: string): Promise<Bet> {
    const round = this.requireCurrentRound();

    const multiplier = this.multiplierAtNow();
    const bet = round.cashOut(playerId, multiplier, new Date());
    await this.rounds.save(round);

    const payout = bet.getPayout();
    if (payout) {
      this.wallet.requestCredit({
        betId: bet.id,
        roundId: round.id,
        playerId: bet.playerId,
        amountCents: payout.toCents().toString(),
      });
    }

    this.events.publish({ type: GameEventType.BetSettled, bet: toBetSnapshot(bet) });
    return bet;
  }

  async onDebitSucceeded(roundId: string, betId: string): Promise<void> {
    const round = await this.loadRound(roundId);
    const bet = round?.getBetById(betId);
    if (!round || !bet) {
      return;
    }

    if (round.getStatus() === RoundStatus.CRASHED && bet.getStatus() === "PENDING") {

      await this.refundLateBet(round, bet);
      return;
    }

    round.confirmBet(betId);
    await this.rounds.save(round);
    this.events.publish({ type: GameEventType.BetSettled, bet: toBetSnapshot(bet) });
  }

  async onDebitFailed(roundId: string, betId: string): Promise<void> {
    const round = await this.loadRound(roundId);
    const bet = round?.rejectBet(betId);
    if (!round || !bet) {
      return;
    }
    await this.rounds.save(round);
    this.events.publish({ type: GameEventType.BetSettled, bet: toBetSnapshot(bet) });
  }

  private async runLoop(startNonce: number): Promise<void> {
    let nonce = startNonce;
    while (this.running) {
      try {
        await this.playRound(nonce);
      } catch (error) {
        this.logger.error(`Round ${nonce} failed: ${String(error)}`);
        await this.sleep(this.config.cooldownMs);
      }
      nonce += 1;
    }
  }

  private async playRound(nonce: number): Promise<void> {
    const round = await this.openRound(nonce);
    this.currentRound = round;

    this.events.publish({
      type: GameEventType.RoundBetting,
      roundId: round.id,
      nonce,
      serverSeedHash: round.serverSeedHash,
      bettingEndsAt: round.getBettingEndsAt().toISOString(),
      bettingDurationMs: this.config.bettingDurationMs,
    });
    await this.sleep(this.config.bettingDurationMs);

    round.start(new Date());
    this.roundStartedAtMs = Date.now();
    await this.rounds.save(round);
    this.events.publish({
      type: GameEventType.RoundStarted,
      roundId: round.id,
      startedAt: (round.getStartedAt() ?? new Date()).toISOString(),
    });

    await this.runMultiplier(round);

    const lost = round.crash(new Date());
    await this.rounds.save(round);
    this.logger.log(
      `Round ${nonce} crashed @ ${round.crashPoint.toString()} (${lost.length} losing bets)`,
    );
    this.events.publish({
      type: GameEventType.RoundCrashed,
      roundId: round.id,
      nonce,
      crashPoint: round.crashPoint.toNumber(),
      crashPointHundredths: round.crashPoint.toHundredths(),
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      crashedAt: (round.getCrashedAt() ?? new Date()).toISOString(),
    });

    await this.sleep(this.config.cooldownMs);
  }

  private async openRound(nonce: number): Promise<Round> {
    const { serverSeed, serverSeedHash } = await this.seeds.getSeedForNonce(nonce);
    const crashHundredths = crashPointHundredths(serverSeed, nonce, {
      houseEdge: this.config.houseEdge,
      maxHundredths: this.config.maxMultiplierHundredths,
    });
    const now = new Date();
    const round = Round.open({
      id: this.ids.generate(),
      nonce,
      serverSeed,
      serverSeedHash,
      crashPoint: Multiplier.fromHundredths(crashHundredths),
      now,
      bettingEndsAt: new Date(now.getTime() + this.config.bettingDurationMs),
    });
    await this.rounds.save(round);
    return round;
  }

  private async runMultiplier(round: Round): Promise<void> {
    const crashAtMs = crashElapsedMs(
      round.crashPoint.toNumber(),
      this.config.growthRatePerMs,
    );
    while (this.running) {
      const elapsed = Date.now() - this.roundStartedAtMs;

      if (elapsed >= crashAtMs) {
        return;
      }
      const multiplier = Multiplier.fromValue(
        multiplierValueAt(elapsed, this.config.growthRatePerMs),
      );
      this.events.publish({
        type: GameEventType.RoundTick,
        roundId: round.id,
        multiplier: multiplier.toNumber(),
        multiplierHundredths: multiplier.toHundredths(),
        elapsedMs: elapsed,
      });
      await this.sleep(this.config.tickIntervalMs);
    }
  }

  private async refundLateBet(round: Round, bet: Bet): Promise<void> {
    round.rejectBet(bet.id);
    await this.rounds.save(round);
    this.wallet.requestCredit({
      betId: bet.id,
      roundId: round.id,
      playerId: bet.playerId,
      amountCents: bet.amount.toCents().toString(),
    });
    this.logger.warn(
      `Bet ${bet.id} funded after round ${round.nonce} crashed; refunded`,
    );
    this.events.publish({ type: GameEventType.BetSettled, bet: toBetSnapshot(bet) });
  }

  private multiplierAtNow(): Multiplier {
    const elapsed = Date.now() - this.roundStartedAtMs;
    const value = multiplierValueAt(elapsed, this.config.growthRatePerMs);
    return Multiplier.fromValue(value);
  }

  private async loadRound(roundId: string): Promise<Round | null> {
    if (this.currentRound && this.currentRound.id === roundId) {
      return this.currentRound;
    }
    return this.rounds.findById(roundId);
  }

  private requireCurrentRound(): Round {
    if (!this.currentRound) {
      throw new NoActiveRoundError();
    }
    return this.currentRound;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
