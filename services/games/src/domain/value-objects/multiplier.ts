import { MULTIPLIER_SCALE } from "../constants/bet-limits";
import { Money } from "./money";

export class Multiplier {
  private constructor(private readonly basisPoints: number) {}

  static fromBasisPoints(basisPoints: number): Multiplier {
    if (!Number.isInteger(basisPoints) || basisPoints < 100) {
      throw new Error("Multiplier must be an integer basis point value of at least 100 (1.00x)");
    }

    return new Multiplier(basisPoints);
  }

  static one(): Multiplier {
    return Multiplier.fromBasisPoints(100);
  }

  get valueInBasisPoints(): number {
    return this.basisPoints;
  }

  isLessThanOrEqual(other: Multiplier): boolean {
    return this.basisPoints <= other.basisPoints;
  }

  isGreaterThan(other: Multiplier): boolean {
    return this.basisPoints > other.basisPoints;
  }

  calculatePayout(betAmount: Money): Money {
    const payoutCents =
      (betAmount.amountInCents * BigInt(this.basisPoints)) / MULTIPLIER_SCALE;

    return Money.fromCents(payoutCents);
  }

  toDisplayString(): string {
    const whole = Math.floor(this.basisPoints / 100);
    const fraction = this.basisPoints % 100;

    return `${whole}.${fraction.toString().padStart(2, "0")}`;
  }

  equals(other: Multiplier): boolean {
    return this.basisPoints === other.basisPoints;
  }
}
