export class Multiplier {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static fromValue(value: number): Multiplier {
    if (value < 1.0) {
      throw new Error("O multiplicador deve ser maior ou igual a 1.0");
    }
    return new Multiplier(value);
  }

  toDecimal(): number {
    return this.value;
  }

  calculatePayout(amountInCents: bigint): bigint {
    return BigInt(Math.round(Number(amountInCents) * this.value));
  }
}