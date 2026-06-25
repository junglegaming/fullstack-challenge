import { BetNotCashableError } from "../errors/game.errors";
import { Money } from "../value-objects/money.vo";
import { Multiplier } from "../value-objects/multiplier.vo";
import { BetStatus } from "./bet-status";

export class Bet {

  private constructor(
    public readonly id: string,
    public readonly roundId: string,
    public readonly playerId: string,
    public readonly username: string,
    public readonly amount: Money,
    private status: BetStatus,
    private cashOutMultiplier: Multiplier | null,
    private payout: Money | null,
    public readonly createdAt: Date,
    private settledAt: Date | null,
  ) {}

  static place(params: {
    id: string;
    roundId: string;
    playerId: string;
    username: string;
    amount: Money;
    now: Date;
  }): Bet {
    return new Bet(
      params.id,
      params.roundId,
      params.playerId,
      params.username,
      params.amount,
      BetStatus.PENDING,
      null,
      null,
      params.now,
      null,
    );
  }

  static rehydrate(params: {
    id: string;
    roundId: string;
    playerId: string;
    username: string;
    amount: Money;
    status: BetStatus;
    cashOutMultiplier: Multiplier | null;
    payout: Money | null;
    createdAt: Date;
    settledAt: Date | null;
  }): Bet {
    return new Bet(
      params.id,
      params.roundId,
      params.playerId,
      params.username,
      params.amount,
      params.status,
      params.cashOutMultiplier,
      params.payout,
      params.createdAt,
      params.settledAt,
    );
  }

  getStatus(): BetStatus {
    return this.status;
  }

  getCashOutMultiplier(): Multiplier | null {
    return this.cashOutMultiplier;
  }

  getPayout(): Money | null {
    return this.payout;
  }

  getSettledAt(): Date | null {
    return this.settledAt;
  }

  isActive(): boolean {
    return this.status === BetStatus.ACTIVE;
  }

  confirm(): void {
    if (this.status !== BetStatus.PENDING) {
      return;
    }
    this.status = BetStatus.ACTIVE;
  }

  reject(): void {
    if (this.status !== BetStatus.PENDING) {
      return;
    }
    this.status = BetStatus.REJECTED;
  }

  cashOut(multiplier: Multiplier, now: Date): Money {
    if (this.status !== BetStatus.ACTIVE) {
      throw new BetNotCashableError(this.status);
    }
    this.status = BetStatus.CASHED_OUT;
    this.cashOutMultiplier = multiplier;

    this.payout = Money.fromCents(multiplier.payoutCents(this.amount.toCents()));
    this.settledAt = now;
    return this.payout;
  }

  markLost(now: Date): void {
    if (this.status !== BetStatus.ACTIVE) {
      return;
    }
    this.status = BetStatus.LOST;
    this.payout = Money.zero();
    this.settledAt = now;
  }
}
