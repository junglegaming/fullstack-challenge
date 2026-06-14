import { randomUUID } from "node:crypto";

export class BetId {
  private constructor(private readonly value: string) {}

  static create(value: string): BetId {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error("Bet id cannot be empty");
    }

    return new BetId(normalized);
  }

  static generate(): BetId {
    return new BetId(randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: BetId): boolean {
    return this.value === other.value;
  }
}
