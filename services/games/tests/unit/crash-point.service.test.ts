import { describe, test, expect } from "bun:test";
import { generateCrashPoint, verifyCrashPoint, bytesToHex } from "../../src/domain/services/crash-point.service";
import { createHash } from "crypto";
import { Multiplier } from "../../src/domain/value-objects/multiplier.vo";

describe("CrashPointService", () => {
  test("should generate deterministic crash point", () => {
    const result1 = generateCrashPoint("server-seed-1", "client-seed-1", "nonce-1");
    const result2 = generateCrashPoint("server-seed-1", "client-seed-1", "nonce-1");
    expect(result1.raw).toBe(result2.raw);
    expect(result1.raw).toBeGreaterThanOrEqual(1.0);
  });

  test("should generate different crash points for different seeds", () => {
    const result1 = generateCrashPoint("server-seed-1", "", "nonce-1");
    const result2 = generateCrashPoint("server-seed-2", "", "nonce-1");
    expect(result1.raw).not.toBe(result2.raw);
  });

  test("should generate different crash points for different nonces", () => {
    const result1 = generateCrashPoint("server-seed-1", "", "nonce-1");
    const result2 = generateCrashPoint("server-seed-1", "", "nonce-2");
    expect(result1.raw).not.toBe(result2.raw);
  });

  test("should verify crash point correctly", () => {
    const serverSeed = "test-server-seed";
    const clientSeed = "test-client-seed";
    const nonce = "test-nonce";

    const crashPoint = generateCrashPoint(serverSeed, clientSeed, nonce);
    const hash = createHash("sha256");
    hash.update(serverSeed);
    const hashedSeed = bytesToHex(new Uint8Array(hash.digest()));

    const isValid = verifyCrashPoint(
      serverSeed,
      clientSeed,
      nonce,
      crashPoint,
      hashedSeed,
    );

    expect(isValid).toBe(true);
  });

  test("should return false for invalid server seed", () => {
    const serverSeed = "test-server-seed";
    const clientSeed = "test-client-seed";
    const nonce = "test-nonce";

    const crashPoint = generateCrashPoint(serverSeed, clientSeed, nonce);
    const hash = createHash("sha256");
    hash.update(serverSeed);
    const hashedSeed = bytesToHex(new Uint8Array(hash.digest()));

    const isValid = verifyCrashPoint(
      "wrong-server-seed",
      clientSeed,
      nonce,
      crashPoint,
      hashedSeed,
    );

    expect(isValid).toBe(false);
  });

  test("crash point should be at least 1.0", () => {
    for (let i = 0; i < 100; i++) {
      const crashPoint = generateCrashPoint(`seed-${i}`, "", `nonce-${i}`);
      expect(crashPoint.raw).toBeGreaterThanOrEqual(1.0);
    }
  });
});
