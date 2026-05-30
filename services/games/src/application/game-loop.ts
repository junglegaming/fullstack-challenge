import { Injectable, OnModuleInit } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Round } from "../domain/round";
import { Money } from "../domain/money";
import { MultiplierCalculator } from "../domain/multiplier-calculator";
import { ProvablyFair } from "../domain/provably-fair";
import { BettingClosedError } from "../domain/errors";
import type { Bet } from "../domain/bet";

const BETTING_DURATION_MS = 10_000;
const CRASHED_DURATION_MS = 3_000;
const TICK_INTERVAL_MS = 100;

@Injectable()
export class GameLoop implements OnModuleInit {
  private currentRound: Round | null = null;
  private tickTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly provablyFair: ProvablyFair) {}

  onModuleInit(): void {
    this.beginBettingPhase();
  }

  getCurrentRound(): Round | null {
    return this.currentRound;
  }

  placeBet(betId: string, playerId: string, amount: Money): void {
    if (!this.currentRound) throw new BettingClosedError();
    this.currentRound.placeBet(betId, playerId, amount);
  }

  cashOut(playerId: string): { multiplier: number; payout: Money } {
    if (!this.currentRound || !this.currentRound.startedAt) {
      throw new BettingClosedError();
    }
    const multiplier = MultiplierCalculator.calculate(this.currentRound.startedAt);
    const payout = this.currentRound.cashOut(playerId, multiplier);
    return { multiplier, payout };
  }

  private beginBettingPhase(): void {
    const seed = this.provablyFair.generateSeed();
    const hash = this.provablyFair.hashSeed(seed);
    const crashPoint = this.provablyFair.deriveCrashPoint(seed);
    this.currentRound = Round.create(randomUUID(), seed, hash, crashPoint);

    // TODO Block 4: emit round.betting via WebSocket
    // payload: { roundId, hash, bettingEndsAt }

    setTimeout(() => this.beginRunningPhase(), BETTING_DURATION_MS);
  }

  private beginRunningPhase(): void {
    this.currentRound!.start();

    // TODO Block 4: emit round.started via WebSocket
    // payload: { roundId, startedAt }

    this.tickTimer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  private tick(): void {
    const round = this.currentRound!;
    const multiplier = MultiplierCalculator.calculate(round.startedAt!);

    // TODO Block 4: emit multiplier.tick via WebSocket
    // payload: { roundId, multiplier, elapsed }

    if (multiplier >= round.crashPoint) {
      clearInterval(this.tickTimer!);
      this.tickTimer = null;
      this.beginCrashedPhase();
    }
  }

  private beginCrashedPhase(): void {
    const lostBets = this.currentRound!.crash();

    // TODO Block 4: emit round.crashed via WebSocket
    // payload: { roundId, crashPoint, seed, bets[] }

    // TODO Block 4: publish wallet.settle for each lostBet via RabbitMQ
    // lostBets.forEach(bet => this.walletPublisher.publishSettle(bet, outcome: "lost"))

    void lostBets; // referenced until Block 4 wires it up

    setTimeout(() => this.beginBettingPhase(), CRASHED_DURATION_MS);
  }

  // Called by Block 4 (RabbitMQ consumer) after cashout settle is confirmed.
  // Exposed here so the consumer can access the current round context.
  getCashedOutBet(playerId: string): Bet | undefined {
    return this.currentRound?.bets.get(playerId);
  }
}
