import type { MultiplierGrowthConfig } from "../utils/multiplier-growth";
import { config } from "../config";

export type MultiplierGrowthPayload = {
  growthBasisPointsPerSecond: number;
  boostAfterGainedBasisPoints?: number;
  boostGrowthBasisPointsPerSecond?: number;
  highBoostAfterGainedBasisPoints?: number;
  highGrowthBasisPointsPerSecond?: number;
};

export function fromMultiplierGrowthPayload(
  payload: MultiplierGrowthPayload,
): MultiplierGrowthConfig {
  const growthConfig: MultiplierGrowthConfig = {
    growthBasisPointsPerSecond: payload.growthBasisPointsPerSecond,
  };

  if (payload.boostAfterGainedBasisPoints !== undefined) {
    growthConfig.boostAfterGainedBasisPoints = payload.boostAfterGainedBasisPoints;
  }

  if (payload.boostGrowthBasisPointsPerSecond !== undefined) {
    growthConfig.boostGrowthBasisPointsPerSecond =
      payload.boostGrowthBasisPointsPerSecond;
  }

  if (payload.highBoostAfterGainedBasisPoints !== undefined) {
    growthConfig.highBoostAfterGainedBasisPoints =
      payload.highBoostAfterGainedBasisPoints;
  }

  if (payload.highGrowthBasisPointsPerSecond !== undefined) {
    growthConfig.highGrowthBasisPointsPerSecond =
      payload.highGrowthBasisPointsPerSecond;
  }

  return growthConfig;
}

export function createFallbackMultiplierGrowthConfig(): MultiplierGrowthConfig {
  return {
    growthBasisPointsPerSecond: config.multiplierGrowthBpsPerSecond,
    boostAfterGainedBasisPoints: config.multiplierBoostAfterGainedBps,
    boostGrowthBasisPointsPerSecond: config.multiplierBoostGrowthBpsPerSecond,
  };
}
