export class Money {
  private readonly amountInCents: bigint;

  private constructor(amountInCents: bigint) {
    if (amountInCents < 0n) {
      throw new Error("Money não pode ser negativo");
    }
    this.amountInCents = amountInCents;
  }

  static fromDecimal(value: number): Money {
    if (isNaN(value)) {
      throw new Error("Valor inválido");
    }
    const cents = BigInt(Math.round(value * 100));
    return new Money(cents);
  }

  static fromCents(cents: bigint): Money {
    return new Money(cents);
  }

  add(other: Money): Money {
    return new Money(this.amountInCents + other.amountInCents);
  }

  subtract(other: Money): Money {
    if (this.amountInCents < other.amountInCents) {
      throw new Error("Saldo insuficiente");
    }
    return new Money(this.amountInCents - other.amountInCents);
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.amountInCents >= other.amountInCents;
  }

  get cents(): bigint {
    return this.amountInCents;
  }

  toDecimal(): number {
    return Number(this.amountInCents) / 100;
  }

  equals(other: Money): boolean {
    return this.amountInCents === other.amountInCents;
  }

  toString(): string {
    const decimal = this.toDecimal();
    return decimal.toFixed(2);
  }
}
