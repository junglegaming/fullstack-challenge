export class NegativeAmountError extends Error {
  constructor() {
    super("Money amount must be a non-negative integer in cents");
  }
}

export class NonIntegerAmountError extends Error {
  constructor() {
    super("Money amount must be an integer (no fractional cents)");
  }
}

export class NegativeResultError extends Error {
  constructor() {
    super("Subtraction would result in a negative amount");
  }
}

export class Money {
  private readonly _cents: number;

  private constructor(cents: number) {
    if (!Number.isInteger(cents)) throw new NonIntegerAmountError();
    if (cents < 0) throw new NegativeAmountError();
    this._cents = cents;
  }

  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  get cents(): number {
    return this._cents;
  }

  add(other: Money): Money {
    return new Money(this._cents + other._cents);
  }

  subtract(other: Money): Money {
    if (other._cents > this._cents) throw new NegativeResultError();
    return new Money(this._cents - other._cents);
  }

  isGreaterThan(other: Money): boolean {
    return this._cents > other._cents;
  }

  equals(other: Money): boolean {
    return this._cents === other._cents;
  }
}
