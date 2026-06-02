import { createHmac, randomBytes } from "node:crypto";

const HOUSE_EDGE = 0.01;

export class ProvablyFair {
  private readonly houseKey: string;

  constructor(houseKey: string) {
    this.houseKey = houseKey;
  }

  generateSeed(): string {
    return randomBytes(32).toString("hex");
  }

  hashSeed(seed: string): string {
    return createHmac("sha256", this.houseKey).update(seed).digest("hex");
  }

  deriveCrashPoint(seed: string): number {
    const hash = this.hashSeed(seed);
    const n = parseInt(hash.slice(0, 8), 16);
    const r = n / 2 ** 32;

    // 1% of rounds crash at 1.00x (house edge)
    if (r < HOUSE_EDGE) return 1.0;

    return Math.max(1.01, Math.floor(100 / (1 - r)) / 100);
  }

  verify(seed: string, expectedHash: string, expectedCrashPoint: number): boolean {
    return (
      this.hashSeed(seed) === expectedHash &&
      this.deriveCrashPoint(seed) === expectedCrashPoint
    );
  }
}
