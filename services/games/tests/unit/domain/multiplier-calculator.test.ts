import { describe, it, expect } from "bun:test";
import { MultiplierCalculator } from "@/domain/multiplier-calculator";

const at = (ms: number) => new Date(ms);

describe("MultiplierCalculator", () => {
  describe("calculate", () => {
    it("returns 1.00 at t=0 (elapsed = 0ms)", () => {
      const startedAt = at(0);
      expect(MultiplierCalculator.calculate(startedAt, at(0))).toBe(1.0);
    });

    it("returns 1.00 when now is before startedAt (clock drift guard)", () => {
      const startedAt = at(10_000);
      expect(MultiplierCalculator.calculate(startedAt, at(5_000))).toBe(1.0);
    });

    it("is approximately 2.00 at t=10s (doubles every 10 seconds)", () => {
      const m = MultiplierCalculator.calculate(at(0), at(10_000));
      // floor(e^(ln2/10 * 10) * 100) / 100 = floor(200) / 100 = 2.00
      expect(m).toBeGreaterThanOrEqual(1.99);
      expect(m).toBeLessThan(2.1);
    });

    it("is approximately 4.00 at t=20s", () => {
      const m = MultiplierCalculator.calculate(at(0), at(20_000));
      expect(m).toBeGreaterThanOrEqual(3.99);
      expect(m).toBeLessThan(4.1);
    });

    it("is approximately 8.00 at t=30s", () => {
      const m = MultiplierCalculator.calculate(at(0), at(30_000));
      expect(m).toBeGreaterThanOrEqual(7.99);
      expect(m).toBeLessThan(8.1);
    });

    it("is always >= 1.00 for any positive elapsed time", () => {
      const startedAt = at(0);
      for (const ms of [1, 100, 500, 1000, 5000, 10_000, 60_000, 300_000]) {
        expect(MultiplierCalculator.calculate(startedAt, at(ms))).toBeGreaterThanOrEqual(1.0);
      }
    });

    it("is monotonically increasing with time", () => {
      const startedAt = at(0);
      const m1 = MultiplierCalculator.calculate(startedAt, at(5_000));
      const m2 = MultiplierCalculator.calculate(startedAt, at(10_000));
      const m3 = MultiplierCalculator.calculate(startedAt, at(30_000));
      const m4 = MultiplierCalculator.calculate(startedAt, at(60_000));
      expect(m2).toBeGreaterThanOrEqual(m1);
      expect(m3).toBeGreaterThan(m2);
      expect(m4).toBeGreaterThan(m3);
    });

    it("has at most 2 decimal places", () => {
      const startedAt = at(0);
      for (const s of [0, 1, 3, 7, 10, 15, 20, 45, 60, 120]) {
        const m = MultiplierCalculator.calculate(startedAt, at(s * 1000));
        expect(Math.round(m * 100) / 100).toBe(m);
      }
    });

    it("is deterministic for the same inputs", () => {
      const startedAt = at(1000);
      const now = at(7500);
      expect(MultiplierCalculator.calculate(startedAt, now)).toBe(
        MultiplierCalculator.calculate(startedAt, now),
      );
    });

    it("uses current time when now is omitted", () => {
      const startedAt = new Date(Date.now() - 5_000); // 5 seconds ago
      const m = MultiplierCalculator.calculate(startedAt);
      expect(m).toBeGreaterThanOrEqual(1.0);
      // at 5s: e^(ln2/10 * 5) ≈ 1.41, so floor to 1.41
      expect(m).toBeLessThan(2.0);
    });
  });
});
