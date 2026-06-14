import { randomUUID } from "node:crypto";

export class WalletId {
  private constructor(private readonly value: string) {}

  static create(value: string): WalletId {
    const normalized = value.trim();

    if (!normalized) {
      throw new Error("Wallet id cannot be empty");
    }

    return new WalletId(normalized);
  }

  static generate(): WalletId {
    return new WalletId(randomUUID());
  }

  toString(): string {
    return this.value;
  }

  equals(other: WalletId): boolean {
    return this.value === other.value;
  }
}
