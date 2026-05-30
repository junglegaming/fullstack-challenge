import { describe, it, expect } from "bun:test";
import { ProvablyFair } from "@/domain/provably-fair";

const HOUSE_KEY = "test-house-key";

describe("ProvablyFair", () => {
  describe("generateSeed", () => {
    it("returns a 64-character hex string", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const seed = pf.generateSeed();
      expect(seed).toHaveLength(64);
      expect(seed).toMatch(/^[0-9a-f]{64}$/);
    });

    it("returns a different seed on each call", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const seeds = new Set(Array.from({ length: 20 }, () => pf.generateSeed()));
      expect(seeds.size).toBe(20);
    });
  });

  describe("hashSeed", () => {
    it("returns a deterministic hash for the same seed and key", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const seed = "abc123";
      expect(pf.hashSeed(seed)).toBe(pf.hashSeed(seed));
    });

    it("returns a 64-character hex string", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const hash = pf.hashSeed("any-seed");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces different hashes for different seeds", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      expect(pf.hashSeed("seed-a")).not.toBe(pf.hashSeed("seed-b"));
    });

    it("produces different hashes for different house keys", () => {
      const pf1 = new ProvablyFair("key-one");
      const pf2 = new ProvablyFair("key-two");
      const seed = "same-seed";
      expect(pf1.hashSeed(seed)).not.toBe(pf2.hashSeed(seed));
    });

    it("produces a different hash when seed is tampered", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const original = pf.hashSeed("original-seed");
      const tampered = pf.hashSeed("tampered-seed");
      expect(original).not.toBe(tampered);
    });
  });

  describe("deriveCrashPoint", () => {
    it("is deterministic for the same seed", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const seed = "deterministic-seed";
      expect(pf.deriveCrashPoint(seed)).toBe(pf.deriveCrashPoint(seed));
    });

    it("always returns a crash point >= 1.00", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      for (let i = 0; i < 200; i++) {
        const crashPoint = pf.deriveCrashPoint(`seed-${i}`);
        expect(crashPoint).toBeGreaterThanOrEqual(1.0);
      }
    });

    it("returns exactly 1.00 when house edge applies", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      // Find a seed that lands in the house-edge bucket (n/2^32 < 0.01)
      let found = false;
      for (let i = 0; i < 2000; i++) {
        if (pf.deriveCrashPoint(`house-edge-probe-${i}`) === 1.0) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
    });

    it("house edge rate is approximately 1% over many rounds", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const total = 1000;
      let houseEdgeCount = 0;
      for (let i = 0; i < total; i++) {
        if (pf.deriveCrashPoint(pf.generateSeed()) === 1.0) {
          houseEdgeCount++;
        }
      }
      // With 1000 samples the expected value is 10; allow a wide window for variance
      expect(houseEdgeCount).toBeGreaterThan(0);
      expect(houseEdgeCount).toBeLessThan(50);
    });

    it("returns >= 1.01 for non-house-edge cases", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      for (let i = 0; i < 200; i++) {
        const crashPoint = pf.deriveCrashPoint(`seed-${i}`);
        if (crashPoint !== 1.0) {
          expect(crashPoint).toBeGreaterThanOrEqual(1.01);
        }
      }
    });

    it("crash point is a number with at most 2 decimal places", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      for (let i = 0; i < 100; i++) {
        const crashPoint = pf.deriveCrashPoint(`seed-${i}`);
        expect(Math.round(crashPoint * 100) / 100).toBe(crashPoint);
      }
    });
  });

  describe("verify", () => {
    it("returns true when seed, hash, and crash point all match", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const seed = "verified-seed";
      const hash = pf.hashSeed(seed);
      const crashPoint = pf.deriveCrashPoint(seed);
      expect(pf.verify(seed, hash, crashPoint)).toBe(true);
    });

    it("returns false when seed is tampered", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const seed = "original-seed";
      const hash = pf.hashSeed(seed);
      const crashPoint = pf.deriveCrashPoint(seed);
      expect(pf.verify("tampered-seed", hash, crashPoint)).toBe(false);
    });

    it("returns false when hash does not match", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const seed = "some-seed";
      const crashPoint = pf.deriveCrashPoint(seed);
      const wrongHash = "a".repeat(64);
      expect(pf.verify(seed, wrongHash, crashPoint)).toBe(false);
    });

    it("returns false when crash point does not match", () => {
      const pf = new ProvablyFair(HOUSE_KEY);
      const seed = "some-seed";
      const hash = pf.hashSeed(seed);
      const wrongCrashPoint = 9999.99;
      expect(pf.verify(seed, hash, wrongCrashPoint)).toBe(false);
    });

    it("commit-reveal: hash shown before reveals nothing about crash point", () => {
      // The crash point can only be computed after the house key is known.
      // A different key produces a different crash point from the same seed.
      const seed = "a-round-seed";
      const pf1 = new ProvablyFair("house-key-A");
      const pf2 = new ProvablyFair("house-key-B");
      const hash1 = pf1.hashSeed(seed);
      const hash2 = pf2.hashSeed(seed);
      expect(hash1).not.toBe(hash2);
      // Each instance can only verify its own round
      expect(pf1.verify(seed, hash1, pf1.deriveCrashPoint(seed))).toBe(true);
      expect(pf1.verify(seed, hash2, pf2.deriveCrashPoint(seed))).toBe(false);
    });
  });
});
