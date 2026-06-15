import { randomUUID } from "node:crypto";

export class RoundId {
  private constructor(private readonly value: string) {}

  static create(value: string): RoundId {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error("Round id cannot be empty");
    }

    return new RoundId(normalized);
  }

  static generate(): RoundId {
    return new RoundId(randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: RoundId): boolean {
    return this.value === other.value;
  }
}
