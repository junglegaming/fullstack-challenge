import { createHash, createHmac, randomBytes } from "node:crypto";
import {
  CRASH_POINT_SCALE,
  HOUSE_EDGE_BASIS_POINTS,
  PROVABLY_FAIR_ALGORITHM,
  UINT52_SPACE,
} from "../constants/provably-fair";
import { Multiplier } from "../value-objects/multiplier";

export type CrashPointInput = {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
};

export type RoundVerificationData = {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  algorithm: string;
  crashPoint: Multiplier;
  isValid: boolean;
};

export class ProvablyFairService {
  generateServerSeed(): string {
    return randomBytes(32).toString("hex");
  }

  hashServerSeed(serverSeed: string): string {
    return createHash("sha256").update(serverSeed).digest("hex");
  }

  calculateCrashPoint(input: CrashPointInput): Multiplier {
    const hash = this.buildRoundHash(input);
    const hashValue = BigInt(`0x${hash.slice(0, 13)}`);

    const rawCrashPointBps =
      (CRASH_POINT_SCALE * UINT52_SPACE - hashValue) / (UINT52_SPACE - hashValue);

    const adjustedCrashPointBps =
      (rawCrashPointBps * (100n - 1n)) / 100n;

    const finalCrashPointBps =
      adjustedCrashPointBps < CRASH_POINT_SCALE
        ? CRASH_POINT_SCALE
        : adjustedCrashPointBps;

    return Multiplier.fromBasisPoints(Number(finalCrashPointBps));
  }

  verifyRound(input: CrashPointInput & { serverSeedHash: string }): RoundVerificationData {
    const calculatedHash = this.hashServerSeed(input.serverSeed);
    const crashPoint = this.calculateCrashPoint(input);

    return {
      serverSeed: input.serverSeed,
      serverSeedHash: calculatedHash,
      clientSeed: input.clientSeed,
      nonce: input.nonce,
      algorithm: PROVABLY_FAIR_ALGORITHM,
      crashPoint,
      isValid: calculatedHash === input.serverSeedHash,
    };
  }

  buildRoundHash(input: CrashPointInput): string {
    return createHmac("sha256", input.serverSeed)
      .update(`${input.clientSeed}:${input.nonce}`)
      .digest("hex");
  }

  get algorithm(): string {
    return PROVABLY_FAIR_ALGORITHM;
  }

  get houseEdgePercent(): number {
    return Number(HOUSE_EDGE_BASIS_POINTS / 100n);
  }
}
