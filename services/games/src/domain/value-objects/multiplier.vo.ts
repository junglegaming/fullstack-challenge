export class Multiplier {
  private constructor(private readonly hundredths: number) {}

  static fromHundredths(hundredths: number): Multiplier {
    if (!Number.isInteger(hundredths) || hundredths < 100) {

      return new Multiplier(Math.max(100, Math.trunc(hundredths)));
    }
    return new Multiplier(hundredths);
  }

  static fromValue(value: number): Multiplier {
    return Multiplier.fromHundredths(Math.floor(value * 100));
  }

  static one(): Multiplier {
    return new Multiplier(100);
  }

  toHundredths(): number {
    return this.hundredths;
  }

  toNumber(): number {
    return this.hundredths / 100;
  }

  toString(): string {
    return `${this.toNumber().toFixed(2)}x`;
  }

  payoutCents(amountCents: bigint): bigint {
    return (amountCents * BigInt(this.hundredths)) / 100n;
  }

  isGreaterThanOrEqual(other: Multiplier): boolean {
    return this.hundredths >= other.hundredths;
  }
}
