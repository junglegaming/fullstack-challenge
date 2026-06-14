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

  static fromCentsString(value: string): Money {
    if (!/^-?\d+$/.test(value)) {
      throw new InvalidMoneyAmountError("Money amount must be an integer string in cents");
    }

    return Money.fromCents(BigInt(value));
  }

  get amountInCents(): bigint {
    return this.cents;
  }

  isZero(): boolean {
    return this.cents === 0n;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.cents >= other.cents;
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    const result = this.cents - other.cents;

    if (result < 0n) {
      throw new InvalidMoneyAmountError("Balance cannot be negative");
    }

    return Money.fromCents(result);
  }

  toDisplayString(): string {
    const negative = this.cents < 0n;
    const absolute = negative ? -this.cents : this.cents;
    const whole = absolute / 100n;
    const fraction = absolute % 100n;
    const fractionText = fraction.toString().padStart(2, "0");

    return `${negative ? "-" : ""}${whole}.${fractionText}`;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }
}
