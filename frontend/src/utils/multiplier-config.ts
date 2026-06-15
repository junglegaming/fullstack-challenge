import type { MultiplierGrowthConfig } from "../utils/multiplier-growth";
import { config } from "../config";

export function createMultiplierGrowthConfig(): MultiplierGrowthConfig {
  return {
    growthBasisPointsPerSecond: config.multiplierGrowthBpsPerSecond,
    boostAfterGainedBasisPoints: config.multiplierBoostAfterGainedBps,
    boostGrowthBasisPointsPerSecond: config.multiplierBoostGrowthBpsPerSecond,
    highBoostAfterGainedBasisPoints: config.multiplierHighBoostAfterGainedBps,
    highGrowthBasisPointsPerSecond: config.multiplierHighGrowthBpsPerSecond,
  };
}
