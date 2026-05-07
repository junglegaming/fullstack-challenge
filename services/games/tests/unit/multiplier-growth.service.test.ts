import { describe, test, expect } from "bun:test";
import { getMultiplierAt } from "../../src/domain/services/multiplier-growth.service";
import { Multiplier } from "../../src/domain/value-objects/multiplier.vo";

describe("MultiplierGrowthService", () => {
  test("should return 1.0 at time 0", () => {
    const multiplier = getMultiplierAt(0);
    expect(multiplier.raw).toBeCloseTo(1.0, 2);
  });

  test("should grow over time", () => {
    const m0 = getMultiplierAt(0);
    const m1000 = getMultiplierAt(1000);
    const m5000 = getMultiplierAt(5000);
    const m10000 = getMultiplierAt(10000);

    expect(m1000.raw).toBeGreaterThan(m0.raw);
    expect(m5000.raw).toBeGreaterThan(m1000.raw);
    expect(m10000.raw).toBeGreaterThan(m5000.raw);
  });

  test("should not decrease", () => {
    const m1000 = getMultiplierAt(1000);
    const m5000 = getMultiplierAt(5000);
    expect(m5000.raw).toBeGreaterThanOrEqual(m1000.raw);
  });

  test("should throw for negative time", () => {
    expect(() => getMultiplierAt(-100)).toThrow();
  });

  test("multiplier growth should follow exponential curve", () => {
    const m0 = getMultiplierAt(0);
    const m10000 = getMultiplierAt(10000); // 10 seconds
    // e^(0.06 * 10) = e^0.6 ≈ 1.82
    expect(m10000.raw).toBeGreaterThan(1.8);
    expect(m10000.raw).toBeLessThan(2.0);
  });
});
