import { InvalidMoneyError } from "../errors/wallet.errors";

export class Money {

  private constructor(private readonly cents: bigint) {}

  static fromCents(cents: bigint | number | string): Money {
    let value: bigint;
    try {
      value = typeof cents === "bigint" ? cents : BigInt(cents);
    } catch {
      throw new InvalidMoneyError(`Invalid cents value: ${String(cents)}`);
    }
    return new Money(value);
  }

  static zero(): Money {
    return new Money(0n);
  }

  static fromDecimalString(input: string): Money {
    const trimmed = input.trim();
    if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
      throw new InvalidMoneyError(`Invalid monetary string: ${input}`);
    }
    const negative = trimmed.startsWith("-");
    const unsigned = negative ? trimmed.slice(1) : trimmed;
    const [whole, fraction = ""] = unsigned.split(".");
    const paddedFraction = (fraction + "00").slice(0, 2);
    const cents = BigInt(whole) * 100n + BigInt(paddedFraction);
    return new Money(negative ? -cents : cents);
  }

  toCents(): bigint {
    return this.cents;
  }

  toDecimalString(): string {
    const negative = this.cents < 0n;
    const abs = negative ? -this.cents : this.cents;
    const whole = abs / 100n;
    const fraction = (abs % 100n).toString().padStart(2, "0");
    return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  isNegative(): boolean {
    return this.cents < 0n;
  }

  isZero(): boolean {
    return this.cents === 0n;
  }

  isPositive(): boolean {
    return this.cents > 0n;
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
