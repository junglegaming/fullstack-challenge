export class Money {
  private readonly cents: bigint;

  constructor(cents: number | bigint) {
    const value = typeof cents === 'bigint' ? cents : BigInt(Math.round(cents));
    if (value < 0n) throw new Error('Money amount cannot be negative');
    this.cents = value;
  }

  get amount(): bigint {
    return this.cents;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    if (this.cents < other.cents) throw new Error('Insufficient funds');
    return new Money(this.cents - other.cents);
  }

  multiply(multiplier: number): Money {
    if (multiplier < 0) throw new Error('Multiplier cannot be negative');
    const result = (this.cents * BigInt(Math.floor(multiplier * 100))) / 100n;
    return new Money(result);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  static fromReais(reais: number): Money {
    return new Money(Math.round(reais * 100));
  }

  static zero(): Money {
    return new Money(0n);
  }
}
