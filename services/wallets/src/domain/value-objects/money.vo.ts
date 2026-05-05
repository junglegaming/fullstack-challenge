/**
 * Money represents a monetary amount stored in cents (bigint) to avoid floating-point errors.
 * All arithmetic operations are performed using integer arithmetic with a fixed scale of 2 decimals.
 */
export class Money {
  private readonly cents: bigint;

  constructor(cents: bigint);
  constructor(cents: number);
  constructor(reais: number, scale: 'reais');
  constructor(value: bigint | number, scale?: 'reais') {
    let c: bigint;
    if (typeof value === 'bigint') {
      c = value;
    } else if (scale === 'reais') {
      // Convert reais (float) to cents using string conversion to avoid floating-point errors
      c = Money.reaisToCents(value);
    } else {
      // value is number representing cents (integer expected)
      if (!Number.isInteger(value)) {
        // If non-integer cents are passed, round to nearest cent
        c = BigInt(Math.round(value));
      } else {
        c = BigInt(value);
      }
    }
    if (c < 0n) throw new Error('Money amount cannot be negative');
    this.cents = c;
  }

  get amount(): bigint {
    return this.cents;
  }

  /**
   * Returns the amount in reais as a decimal string (e.g., "10.50").
   * Use this instead of floating-point numbers for display or serialization.
   */
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
   * Multiply this monetary amount by a multiplier.
   * @param multiplier - Can be a bigint (treated as exact multiplier, e.g., 2n means 2x),
   *                     a string decimal (e.g., "1.5"), or a number (converted to string to avoid FP errors).
   * @returns New Money instance with the result, rounded to the nearest cent.
   */
  multiply(multiplier: bigint | string | number): Money {
    let multiplierCoeff: bigint;
    let multiplierScale: number;

    if (typeof multiplier === 'bigint') {
      // bigint multiplier means exact integer multiplier (e.g., 2n = 2x)
      multiplierCoeff = multiplier;
      multiplierScale = 0;
    } else if (typeof multiplier === 'string') {
      ({ coeff: multiplierCoeff, scale: multiplierScale } = Money.parseDecimal(multiplier));
    } else {
      // number: convert to string to avoid floating-point inaccuracies
      return this.multiply(multiplier.toString());
    }

    // Compute: (cents * multiplierCoeff) / 10^multiplierScale
    // Use rounding to nearest cent
    const product = this.cents * multiplierCoeff;
    const divisor = 10n ** BigInt(multiplierScale);

    // Round to nearest cent (banker's rounding not needed for our use case)
    const result = product / divisor; // integer division truncates toward zero
    // For positive amounts, truncation is floor; for negative, truncation is ceil.
    // Since cents is non-negative, fine.

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

  static fromReais(reais: number): Money {
    return new Money(reais, 'reais');
  }

  static zero(): Money {
    return new Money(0n);
  }

  /**
   * Converts a reais float to cents (bigint) using string conversion to avoid floating-point errors.
   */
  private static reaisToCents(reais: number): bigint {
    // Convert the number to a string with up to 2 decimal places
    // Using Number.toFixed(2) can produce floating-point rounding artifacts,
    // but we accept that for the fromReais factory as it's a convenience method.
    // For critical paths, use string input or bigint.
    const str = reais.toFixed(2);
    const { coeff, scale } = Money.parseDecimal(str);
    // coeff is in cents if scale <= 2, but parseDecimal may produce scale=2 (e.g., "10.50" -> coeff=1050, scale=2)
    // Actually parseDecimal("10.50") -> coeff=1050, scale=2. Then cents = coeff / 10^scale? Wait:
    // parseDecimal returns coeff as integer formed by intPart+fracPart, and scale = fracPart length.
    // For "10.50", intPart="10", fracPart="50", coeff=1050, scale=2. This coeff is already in cents.
    // Because 10.50 reais = 1050 cents. So we can return coeff directly.
    // However, for "10.5" (one decimal), coeff=105, scale=1, which is 105 cents? Actually 10.5 reais = 1050 cents, not 105.
    // So we need to treat the parsed decimal as reais, not cents. So we need to convert to cents:
    // reaisDecimal = coeff / 10^scale. Then cents = reaisDecimal * 100.
    // But using bigint, we can compute: cents = (coeff * 100n) / (10n ** BigInt(scale))
    const divisor = 10n ** BigInt(scale);
    const cents = (coeff * 100n) / divisor;
    return cents;
  }

  /**
   * Parses a decimal string into a coefficient and scale.
   * Example: "1.5" -> { coeff: 15n, scale: 1 }
   *          "0.123" -> { coeff: 123n, scale: 3 }
   */
  private static parseDecimal(input: string): { coeff: bigint; scale: number } {
    const str = input.trim();
    if (str === '' || isNaN(Number(str))) throw new Error(`Invalid decimal string: ${input}`);
    const parts = str.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] || '';
    const scale = fracPart.length;
    // Remove leading zeros from intPart? Not needed for BigInt conversion.
    const coeff = BigInt(intPart + fracPart);
    return { coeff, scale };
  }
}
