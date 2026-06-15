import { describe, expect, it } from "bun:test";
import {
  PROVABLY_FAIR_TEST_FIXTURE,
} from "../../../../src/domain/constants/provably-fair";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";

describe("ProvablyFairService", () => {
  const service = new ProvablyFairService();

  it("generates server seed as hex string", () => {
    const serverSeed = service.generateServerSeed();

    expect(serverSeed).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes server seed with sha256", () => {
    const hash = service.hashServerSeed(PROVABLY_FAIR_TEST_FIXTURE.serverSeed);

    expect(hash).toBe(PROVABLY_FAIR_TEST_FIXTURE.expectedServerSeedHash);
  });

  it("calculates deterministic crash point from fixed seeds using 52-bit algorithm", () => {
    const crashPoint = service.calculateCrashPoint({
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
    });

    expect(crashPoint.valueInBasisPoints).toBe(
      PROVABLY_FAIR_TEST_FIXTURE.expectedCrashPointBps,
    );
    expect(crashPoint.toDecimalString()).toBe(
      PROVABLY_FAIR_TEST_FIXTURE.expectedCrashPointDisplay,
    );
  });

  it("verifies committed hash against revealed server seed", () => {
    const verification = service.verifyRound({
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
      serverSeedHash: PROVABLY_FAIR_TEST_FIXTURE.expectedServerSeedHash,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
    });

    expect(verification.isValid).toBe(true);
    expect(verification.algorithm).toBe("HMAC_SHA256_SHA256_HASH_COMMITMENT");
    expect(verification.crashPoint.valueInBasisPoints).toBe(
      PROVABLY_FAIR_TEST_FIXTURE.expectedCrashPointBps,
    );
  });

  it("rejects verification when hash does not match server seed", () => {
    const verification = service.verifyRound({
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
      serverSeedHash: "invalid-hash",
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
    });

    expect(verification.isValid).toBe(false);
  });

  it("produces same crash point for same inputs", () => {
    const input = {
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
    };

    const first = service.calculateCrashPoint(input);
    const second = service.calculateCrashPoint(input);

    expect(first.equals(second)).toBe(true);
  });

  it("never returns crash point below 1.00x", () => {
    for (let nonce = 0; nonce < 50; nonce += 1) {
      const crashPoint = service.calculateCrashPoint({
        serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
        clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
        nonce,
      });

      expect(crashPoint.valueInBasisPoints).toBeGreaterThanOrEqual(100);
    }
  });
});
