import { Injectable, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Round } from "../domain/round";
import { Money } from "../domain/money";
import { MultiplierCalculator } from "../domain/multiplier-calculator";
import { ProvablyFair } from "../domain/provably-fair";
import { BettingClosedError } from "../domain/errors";
import { TypeOrmGameRepository } from "../infrastructure/persistence/typeorm-game.repository";
import { GameEventsPublisher } from "../infrastructure/messaging/game-events.publisher";
import { GameGateway } from "../presentation/gateways/game.gateway";
import type { Bet } from "../domain/bet";

const BETTING_DURATION_MS = 10_000;
const CRASHED_DURATION_MS = 3_000;
const TICK_INTERVAL_MS = 100;

@Injectable()
export class GameLoop implements OnModuleInit {
  private currentRound: Round | null = null;
  private bettingEndsAt: Date | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly provablyFair: ProvablyFair,
    private readonly repository: TypeOrmGameRepository,
    private readonly gateway: GameGateway,
    private readonly publisher: GameEventsPublisher,
  ) {}

  onModuleInit(): void {
    this.beginBettingPhase();
  }

  getCurrentRound(): Round | null {
    return this.currentRound;
  }

  getBettingEndsAt(): Date | null {
    return this.bettingEndsAt;
  }

  placeBet(betId: string, playerId: string, amount: Money): void {
    if (!this.currentRound) throw new BettingClosedError();
    this.currentRound.placeBet(betId, playerId, amount);
  }

  cashOut(playerId: string): { multiplier: number; payout: Money } {
    if (!this.currentRound?.startedAt) throw new BettingClosedError();
    const multiplier = MultiplierCalculator.calculate(this.currentRound.startedAt);
    const payout = this.currentRound.cashOut(playerId, multiplier);
    return { multiplier, payout };
  }

  cancelBet(playerId: string): void {
    this.currentRound?.cancelBet(playerId);
  }

  getBetForPlayer(playerId: string): Bet | undefined {
    return this.currentRound?.bets.get(playerId);
  }

  private beginBettingPhase(): void {
    const seed = this.provablyFair.generateSeed();
    const hash = this.provablyFair.hashSeed(seed);
    const crashPoint = this.provablyFair.deriveCrashPoint(seed);
    this.currentRound = Round.create(randomUUID(), seed, hash, crashPoint);
    this.bettingEndsAt = new Date(Date.now() + BETTING_DURATION_MS);

    void this.repository.saveRound(this.currentRound);
    this.gateway.emitRoundBetting(this.currentRound.id, hash, this.bettingEndsAt);

    setTimeout(() => this.beginRunningPhase(), BETTING_DURATION_MS);
  }

  private beginRunningPhase(): void {
    this.bettingEndsAt = null;
    this.currentRound!.start();

    void this.repository.saveRound(this.currentRound!);
    this.gateway.emitRoundStarted(this.currentRound!.id, this.currentRound!.startedAt!);

    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  private tick(): void {
    const round = this.currentRound!;
    const elapsedMs = Date.now() - round.startedAt!.getTime();
    const multiplier = MultiplierCalculator.calculate(round.startedAt!);

    this.gateway.emitMultiplierTick(round.id, multiplier, elapsedMs);

    if (multiplier >= round.crashPoint) {
      clearInterval(this.tickTimer!);
      this.tickTimer = null;
      this.beginCrashedPhase();
    }
  }

  private beginCrashedPhase(): void {
    const round = this.currentRound!;
    const lostBets = round.crash();

    void this.repository.saveRound(round);

    const betSummaries = [...round.bets.values()].map((b) => ({
      playerId: b.playerId,
      amountCents: b.amount.cents,
      status: b.status,
      payoutCents: b.payout?.cents ?? null,
    }));
    this.gateway.emitRoundCrashed(round.id, round.crashPoint, round.seed, betSummaries);

    for (const bet of lostBets) {
      void this.repository.saveBet(bet, round.id);
      void this.publisher.publishSettle(bet.id, bet.playerId, "loss");
    }

    setTimeout(() => this.beginBettingPhase(), CRASHED_DURATION_MS);
  }
}
