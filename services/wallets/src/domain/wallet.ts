import { randomUUID } from "crypto";
import { Money } from "./money";

export class Wallet {
  private readonly _id: string;
  private readonly _playerId: string;
  private _availableBalance: Money;
  private readonly _reservations: Map<string, Money>;

  private constructor(
    id: string,
    playerId: string,
    availableBalance: Money,
    reservations: Map<string, Money>,
  ) {
    this._id = id;
    this._playerId = playerId;
    this._availableBalance = availableBalance;
    this._reservations = reservations;
  }

  static create(playerId: string): Wallet {
    return new Wallet(
      randomUUID(),
      playerId,
      Money.fromCents(0),
      new Map(),
    );
  }

  static reconstitute(
    id: string,
    playerId: string,
    availableBalance: Money,
    reservations: Map<string, Money>,
  ): Wallet {
    return new Wallet(id, playerId, availableBalance, reservations);
  }

  get id(): string {
    return this._id;
  }

  get playerId(): string {
    return this._playerId;
  }

  get availableBalance(): Money {
    return this._availableBalance;
  }

  get reservedBalance(): Money {
    let total = Money.fromCents(0);
    for (const amount of this._reservations.values()) {
      total = total.add(amount);
    }
    return total;
  }

  get reservations(): ReadonlyMap<string, Money> {
    return this._reservations;
  }
}
