import { describe, expect, it } from "vitest";
import {
  calculateGainedBasisPoints,
  calculateMultiplierDisplay,
  calibrateStartedAtMs,
  interpolateMultiplierBetweenTicks,
  resolveRunningMultiplierDisplay,
} from "./multiplier-growth";

const balancedConfig = {
  growthBasisPointsPerSecond: 40,
  boostAfterGainedBasisPoints: 100,
  boostGrowthBasisPointsPerSecond: 60,
  highBoostAfterGainedBasisPoints: 1900,
  highGrowthBasisPointsPerSecond: 150,
};

describe("multiplier growth", () => {
  it("uses base growth before 2.00x", () => {
    expect(calculateMultiplierDisplay(2500, balancedConfig)).toBe("2.00");
  });

  it("grows moderately between 2.00x and 20.00x", () => {
    expect(calculateMultiplierDisplay(32_500, balancedConfig)).toBe("20.00");
  });

  it("accelerates after 20.00x without jumping too fast", () => {
    expect(calculateMultiplierDisplay(39_167, balancedConfig)).toBe("30.00");
  });

  it("keeps linear growth when boost is disabled", () => {
    expect(
      calculateGainedBasisPoints(1500, {
        growthBasisPointsPerSecond: 100,
      }),
    ).toBe(150);
  });

  it("interpolates smoothly between websocket ticks", () => {
    const from = { multiplier: 8, at: 1000 };
    const to = { multiplier: 10, at: 1250 };

    expect(interpolateMultiplierBetweenTicks(from, to, 1125)).toBe("9.00");
    expect(interpolateMultiplierBetweenTicks(from, to, 1250)).toBe("10.00");
  });

  it("calibrates startedAt from authoritative server ticks", () => {
    const startedAtMs = 0;
    const tick = { multiplier: 2, at: 2500 };
    const calibrated = calibrateStartedAtMs(startedAtMs, tick, balancedConfig);

    expect(
      calculateMultiplierDisplay(2500 - calibrated, balancedConfig),
    ).toBe("2.00");
  });

  it("never renders above the latest server multiplier", () => {
    expect(
      resolveRunningMultiplierDisplay(
        10_000,
        0,
        balancedConfig,
        "2.00",
      ),
    ).toBe("2.00");
  });
});
