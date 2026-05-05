export class Multiplier {
  private readonly value: number;

  constructor(value: number) {
    if (!Number.isFinite(value)) throw new Error('Multiplier must be a finite number');
    if (value < 1.0) throw new Error('Multiplier must be greater than or equal to 1.0');
    this.value = value;
  }

  get raw(): number {
    return this.value;
  }

  isGreaterThanOrEqual(other: Multiplier): boolean {
    return this.value >= other.value;
  }

  isLessThan(other: Multiplier): boolean {
    return this.value < other.value;
  }

  equals(other: Multiplier): boolean {
    return this.value === other.value;
  }
}
