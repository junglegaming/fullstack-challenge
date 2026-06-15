import { InvalidMoneyAmountError } from "../errors/invalid-money-amount.error";

export class Money {
  private constructor(private readonly cents: bigint) {}

  static zero(): Money {
    return new Money(0n);
  }

  static fromCents(cents: bigint): Money {
    if (cents < 0n) {
      throw new InvalidMoneyAmountError();
    }

    return new Money(cents);
  }

  get amountInCents(): bigint {
    return this.cents;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.cents >= other.cents;
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
