/**
 * Money represents a monetary amount stored in cents (bigint) to avoid floating-point errors.
 * All arithmetic operations are performed using integer arithmetic with a fixed scale of 2 decimals.
 */
export class Money {
  private readonly cents: bigint;

  constructor(cents: bigint);
  constructor(reais: string, scale: 'reais');
  constructor(value: bigint | string, scale?: 'reais') {
    let c: bigint;
    if (typeof value === 'bigint') {
      c = value;
    } else if (scale === 'reais') {
      c = Money.reaisToCents(value);
    } else {
      c = BigInt(value);
    }
    if (c < 0n) throw new Error('Money amount cannot be negative');
    this.cents = c;
  }

  get amount(): bigint {
    return this.cents;
  }

  get reaisString(): string {
    const sign = this.cents < 0n ? '-' : '';
    const absCents = this.cents < 0n ? -this.cents : this.cents;
    const intPart = absCents / 100n;
    const fracPart = absCents % 100n;
    return `${sign}${intPart}.${fracPart.toString().padStart(2, '0')}`;
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    const result = this.cents - other.cents;
    if (result < 0n) throw new Error('Insufficient funds');
    return new Money(result);
  }

  /**
   * Multiply by a multiplier. Accepts bigint (exact integer multiplier), string decimal, or number (converted via string).
   */
  multiply(multiplier: bigint | string | number): Money {
    let multiplierCoeff: bigint;
    let multiplierScale: number;

    if (typeof multiplier === 'bigint') {
      multiplierCoeff = multiplier;
      multiplierScale = 0;
    } else if (typeof multiplier === 'string') {
      ({ coeff: multiplierCoeff, scale: multiplierScale } = Money.parseDecimal(multiplier));
    } else {
      return this.multiply(multiplier.toString());
    }

    const product = this.cents * multiplierCoeff;
    const divisor = 10n ** BigInt(multiplierScale);
    const result = product / divisor;
    return new Money(result);
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  static fromReais(reais: string): Money {
    return new Money(reais, 'reais');
  }

  static zero(): Money {
    return new Money(0n);
  }

  private static reaisToCents(reais: string): bigint {
    const str = reais;
    const { coeff, scale } = Money.parseDecimal(str);
    const divisor = 10n ** BigInt(scale);
    const cents = (coeff * 100n) / divisor;
    return cents;
  }

  private static parseDecimal(input: string): { coeff: bigint; scale: number } {
    const str = input.trim();
    if (str === '' || isNaN(Number(str))) throw new Error(`Invalid decimal string: ${input}`);
    const parts = str.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] || '';
    const scale = fracPart.length;
    const coeff = BigInt(intPart + fracPart);
    return { coeff, scale };
  }
}
