import { describe, expect, it } from "vitest";
import { calculateGainedBasisPoints } from "../../../../src/domain/services/multiplier-growth";

const balancedConfig = {
  growthBasisPointsPerSecond: 40,
  boostAfterGainedBasisPoints: 100,
  boostGrowthBasisPointsPerSecond: 60,
  highBoostAfterGainedBasisPoints: 1900,
  highGrowthBasisPointsPerSecond: 150,
};

describe("calculateGainedBasisPoints", () => {
  it("uses base growth before 2.00x", () => {
    const gained = calculateGainedBasisPoints(2500, balancedConfig);

    expect(gained).toBe(100);
  });

  it("uses moderate growth between 2.00x and 20.00x", () => {
    const gained = calculateGainedBasisPoints(32_500, balancedConfig);

    expect(gained).toBe(1900);
  });

  it("accelerates after 20.00x without jumping too fast", () => {
    const gained = calculateGainedBasisPoints(39_167, balancedConfig);

    expect(gained).toBe(2900);
  });

  it("keeps linear growth when boost is disabled", () => {
    const gained = calculateGainedBasisPoints(1500, {
      growthBasisPointsPerSecond: 100,
    });

    expect(gained).toBe(150);
  });
});
