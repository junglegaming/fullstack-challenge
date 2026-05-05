/**
 * Multiplier represents a multiplier value (e.g., 1.5x).
 * Internally stores as a bigint scaled by 10000 for precise arithmetic.
 * The raw getter returns a floating-point approximation for backward compatibility.
 */
export class Multiplier {
  private readonly scaled: bigint; // scaled by 10000
  private readonly rawNumber: number; // original float approximation for raw()
  private static readonly SCALE = 10000n;

  constructor(value: number | string) {
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new Error('Multiplier must be a finite number');
      this.rawNumber = value;
      // Convert number to scaled integer via string to avoid FP errors
      const str = value.toString();
      const { coeff, scale } = Multiplier.parseDecimal(str);
      const divisor = 10n ** BigInt(scale);
      this.scaled = (coeff * Multiplier.SCALE) / divisor;
    } else {
      // string input
      const { coeff, scale } = Multiplier.parseDecimal(value);
      const divisor = 10n ** BigInt(scale);
      this.scaled = (coeff * Multiplier.SCALE) / divisor;
      this.rawNumber = Number(this.scaled) / Number(Multiplier.SCALE);
    }

    if (this.scaled < Multiplier.SCALE) {
      throw new Error('Multiplier must be greater than or equal to 1.0');
    }
  }

  /** Returns a floating-point approximation (may lose precision). */
  get raw(): number {
    return this.rawNumber;
  }

  /** Returns the multiplier as a decimal string (e.g., "1.5"). */
  toDecimalString(): string {
    const intPart = this.scaled / Multiplier.SCALE;
    const fracPart = this.scaled % Multiplier.SCALE;
    return `${intPart}.${fracPart.toString().padStart(4, '0')}`;
  }

  /** Returns the scaled value (bigint) where actual multiplier = scaled / 10000. */
  get scaledValue(): bigint {
    return this.scaled;
  }

  isGreaterThanOrEqual(other: Multiplier): boolean {
    return this.scaled >= other.scaled;
  }

  isLessThan(other: Multiplier): boolean {
    return this.scaled < other.scaled;
  }

  equals(other: Multiplier): boolean {
    return this.scaled === other.scaled;
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
