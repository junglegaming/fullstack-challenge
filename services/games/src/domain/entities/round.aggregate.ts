import {
  BetAmountOutOfRangeError,
  BetOutsideBettingPhaseError,
  CashOutOutsideRunningPhaseError,
  DuplicateBetError,
  InvalidRoundTransitionError,
  NoActiveBetError,
} from "../errors/game.errors";
import { Money } from "../value-objects/money.vo";
import { Multiplier } from "../value-objects/multiplier.vo";
import { Bet } from "./bet.entity";
import { RoundStatus } from "./round-status";

export interface BetLimits {
  minCents: bigint;
  maxCents: bigint;
}

export class Round {

  private constructor(
    public readonly id: string,
    public readonly nonce: number,
    private status: RoundStatus,
    public readonly serverSeed: string,
    public readonly serverSeedHash: string,
    public readonly crashPoint: Multiplier,
    private readonly bets: Map<string, Bet>,
    public readonly createdAt: Date,
    private bettingEndsAt: Date,
    private startedAt: Date | null,
    private crashedAt: Date | null,
  ) {}

  static open(params: {
    id: string;
    nonce: number;
    serverSeed: string;
    serverSeedHash: string;
    crashPoint: Multiplier;
    now: Date;
    bettingEndsAt: Date;
  }): Round {
    return new Round(
      params.id,
      params.nonce,
      RoundStatus.BETTING,
      params.serverSeed,
      params.serverSeedHash,
      params.crashPoint,
      new Map(),
      params.now,
      params.bettingEndsAt,
      null,
      null,
    );
  }

  static rehydrate(params: {
    id: string;
    nonce: number;
    status: RoundStatus;
    serverSeed: string;
    serverSeedHash: string;
    crashPoint: Multiplier;
    bets: Bet[];
    createdAt: Date;
    bettingEndsAt: Date;
    startedAt: Date | null;
    crashedAt: Date | null;
  }): Round {
    const map = new Map<string, Bet>();
    for (const bet of params.bets) {
      map.set(bet.playerId, bet);
    }
    return new Round(
      params.id,
      params.nonce,
      params.status,
      params.serverSeed,
      params.serverSeedHash,
      params.crashPoint,
      map,
      params.createdAt,
      params.bettingEndsAt,
      params.startedAt,
      params.crashedAt,
    );
  }

  getStatus(): RoundStatus {
    return this.status;
  }

  getBettingEndsAt(): Date {
    return this.bettingEndsAt;
  }

  getStartedAt(): Date | null {
    return this.startedAt;
  }

  getCrashedAt(): Date | null {
    return this.crashedAt;
  }

  getBets(): Bet[] {
    return [...this.bets.values()];
  }

  getBetByPlayer(playerId: string): Bet | undefined {
    return this.bets.get(playerId);
  }

  getBetById(betId: string): Bet | undefined {
    return this.getBets().find((bet) => bet.id === betId);
  }

  placeBet(params: {
    betId: string;
    playerId: string;
    username: string;
    amount: Money;
    limits: BetLimits;
    now: Date;
  }): Bet {
    if (this.status !== RoundStatus.BETTING) {
      throw new BetOutsideBettingPhaseError();
    }
    if (this.bets.has(params.playerId)) {
      throw new DuplicateBetError();
    }
    const cents = params.amount.toCents();

    if (cents < params.limits.minCents || cents > params.limits.maxCents) {
      throw new BetAmountOutOfRangeError(
        params.limits.minCents,
        params.limits.maxCents,
      );
    }
    const bet = Bet.place({
      id: params.betId,
      roundId: this.id,
      playerId: params.playerId,
      username: params.username,
      amount: params.amount,
      now: params.now,
    });
    this.bets.set(params.playerId, bet);
    return bet;
  }

  confirmBet(betId: string): Bet | undefined {
    const bet = this.getBetById(betId);
    bet?.confirm();
    return bet;
  }

  rejectBet(betId: string): Bet | undefined {
    const bet = this.getBetById(betId);
    bet?.reject();
    return bet;
  }

  cashOut(playerId: string, multiplier: Multiplier, now: Date): Bet {
    if (this.status !== RoundStatus.RUNNING) {
      throw new CashOutOutsideRunningPhaseError();
    }
    const bet = this.bets.get(playerId);
    if (!bet || !bet.isActive()) {
      throw new NoActiveBetError();
    }
    bet.cashOut(multiplier, now);
    return bet;
  }

  start(now: Date): void {
    if (this.status !== RoundStatus.BETTING) {
      throw new InvalidRoundTransitionError(this.status, RoundStatus.RUNNING);
    }
    this.status = RoundStatus.RUNNING;
    this.startedAt = now;
  }

  crash(now: Date): Bet[] {
    if (this.status !== RoundStatus.RUNNING) {
      throw new InvalidRoundTransitionError(this.status, RoundStatus.CRASHED);
    }
    this.status = RoundStatus.CRASHED;
    this.crashedAt = now;
    const lost: Bet[] = [];
    for (const bet of this.bets.values()) {
      if (bet.isActive()) {
        bet.markLost(now);
        lost.push(bet);
      }
    }
    return lost;
  }
}
