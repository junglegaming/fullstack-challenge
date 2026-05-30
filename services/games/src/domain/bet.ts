import { AlreadyCashedOutError } from "./errors";
import { Money } from "./money";

export enum BetStatus {
  PENDING = "PENDING",
  CASHED_OUT = "CASHED_OUT",
  LOST = "LOST",
}

export class Bet {
  private constructor(
    private readonly _id: string,
    private readonly _roundId: string,
    private readonly _playerId: string,
    private readonly _amount: Money,
    private _status: BetStatus,
    private _payout: Money | null,
  ) {}

  static create(
    id: string,
    roundId: string,
    playerId: string,
    amount: Money,
  ): Bet {
    return new Bet(id, roundId, playerId, amount, BetStatus.PENDING, null);
  }

  static reconstitute(
    id: string,
    roundId: string,
    playerId: string,
    amount: Money,
    status: BetStatus,
    payout: Money | null,
  ): Bet {
    return new Bet(id, roundId, playerId, amount, status, payout);
  }

  get id(): string { return this._id; }
  get roundId(): string { return this._roundId; }
  get playerId(): string { return this._playerId; }
  get amount(): Money { return this._amount; }
  get status(): BetStatus { return this._status; }
  get payout(): Money | null { return this._payout; }

  calculatePayout(multiplier: number): Money {
    return Money.fromCents(Math.floor(this._amount.cents * multiplier));
  }

  cashOut(multiplier: number): Money {
    if (this._status === BetStatus.CASHED_OUT) {
      throw new AlreadyCashedOutError(this._id);
    }
    const payout = this.calculatePayout(multiplier);
    this._status = BetStatus.CASHED_OUT;
    this._payout = payout;
    return payout;
  }

  lose(): void {
    this._status = BetStatus.LOST;
  }
}
