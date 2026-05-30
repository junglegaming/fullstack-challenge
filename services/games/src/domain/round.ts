import {
  BetAlreadyPlacedError,
  BetNotFoundError,
  BettingClosedError,
  CashoutNotAllowedError,
  InvalidRoundStateError,
} from "./errors";
import { Bet, BetStatus } from "./bet";
import { Money } from "./money";

export enum RoundState {
  BETTING = "BETTING",
  RUNNING = "RUNNING",
  CRASHED = "CRASHED",
}

export class Round {
  private constructor(
    private readonly _id: string,
    private _state: RoundState,
    private readonly _seed: string,
    private readonly _hash: string,
    private readonly _crashPoint: number,
    private _startedAt: Date | null,
    private readonly _bets: Map<string, Bet>, // playerId → Bet
  ) {}

  static create(
    id: string,
    seed: string,
    hash: string,
    crashPoint: number,
  ): Round {
    return new Round(id, RoundState.BETTING, seed, hash, crashPoint, null, new Map());
  }

  static reconstitute(
    id: string,
    state: RoundState,
    seed: string,
    hash: string,
    crashPoint: number,
    startedAt: Date | null,
    bets: Bet[],
  ): Round {
    const betMap = new Map(bets.map((b) => [b.playerId, b]));
    return new Round(id, state, seed, hash, crashPoint, startedAt, betMap);
  }

  get id(): string { return this._id; }
  get state(): RoundState { return this._state; }
  get seed(): string { return this._seed; }
  get hash(): string { return this._hash; }
  get crashPoint(): number { return this._crashPoint; }
  get startedAt(): Date | null { return this._startedAt; }
  get bets(): ReadonlyMap<string, Bet> { return this._bets; }

  placeBet(betId: string, playerId: string, amount: Money): void {
    if (this._state !== RoundState.BETTING) throw new BettingClosedError();
    if (this._bets.has(playerId)) throw new BetAlreadyPlacedError(playerId);
    this._bets.set(playerId, Bet.create(betId, this._id, playerId, amount));
  }

  start(): void {
    if (this._state !== RoundState.BETTING) {
      throw new InvalidRoundStateError(RoundState.BETTING, this._state);
    }
    this._state = RoundState.RUNNING;
    this._startedAt = new Date();
  }

  cashOut(playerId: string, multiplier: number): Money {
    if (this._state !== RoundState.RUNNING) throw new CashoutNotAllowedError();
    const bet = this._bets.get(playerId);
    if (!bet) throw new BetNotFoundError(playerId);
    return bet.cashOut(multiplier); // throws AlreadyCashedOutError if already done
  }

  crash(): Bet[] {
    if (this._state !== RoundState.RUNNING) {
      throw new InvalidRoundStateError(RoundState.RUNNING, this._state);
    }
    this._state = RoundState.CRASHED;
    const lost: Bet[] = [];
    for (const bet of this._bets.values()) {
      if (bet.status === BetStatus.PENDING) {
        bet.lose();
        lost.push(bet);
      }
    }
    return lost;
  }

  // Removes a PENDING bet; used when the wallet rejects the reservation.
  cancelBet(playerId: string): void {
    const bet = this._bets.get(playerId);
    if (bet && bet.status === BetStatus.PENDING) {
      this._bets.delete(playerId);
    }
  }
}
