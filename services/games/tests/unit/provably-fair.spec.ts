import { expect, test, describe } from "bun:test";
import { ProvablyFair } from "../../src/domain/entities/ProvablyFair";

describe("Provably Fair", () => {
  const clientSeed = "test-client-seed";
  const nonce = 1;

  test("deve gerar o mesmo crash point para a mesma seed e nonce", () => {
    const serverSeed = "a".repeat(64);
    const seed1 = ProvablyFair.createSeed(clientSeed, nonce, serverSeed);
    const crashPoint1 = ProvablyFair.calculateCrashPoint(seed1);

    const seed2 = ProvablyFair.createSeed(clientSeed, nonce, serverSeed);
    const crashPoint2 = ProvablyFair.calculateCrashPoint(seed2);

    expect(crashPoint1).toBe(crashPoint2);
  });

  test("deve gerar crash points diferentes para nonces diferentes", () => {
    const seed1 = ProvablyFair.createSeed(clientSeed, 1);
    const crashPoint1 = ProvablyFair.calculateCrashPoint(seed1);

    const seed2 = ProvablyFair.createSeed(clientSeed, 2);
    const crashPoint2 = ProvablyFair.calculateCrashPoint(seed2);

    expect(crashPoint1).not.toBe(crashPoint2);
  });

  test("deve gerar crash points diferentes para client seeds diferentes", () => {
    const seed1 = ProvablyFair.createSeed("seed-1", nonce);
    const crashPoint1 = ProvablyFair.calculateCrashPoint(seed1);

    const seed2 = ProvablyFair.createSeed("seed-2", nonce);
    const crashPoint2 = ProvablyFair.calculateCrashPoint(seed2);

    expect(crashPoint1).not.toBe(crashPoint2);
  });

  test("deve gerar um crash point >= 1.0", () => {
    for (let i = 0; i < 100; i++) {
      const seed = ProvablyFair.createSeed(`seed-${i}`, i);
      const crashPoint = ProvablyFair.calculateCrashPoint(seed);
      expect(crashPoint).toBeGreaterThanOrEqual(1.0);
    }
  });
});
