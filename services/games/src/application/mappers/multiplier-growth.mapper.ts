import type { MultiplierGrowthConfig } from "../../domain/services/multiplier-growth";
import type { MultiplierGrowthPayload } from "../realtime/game-realtime-events";

export function toMultiplierGrowthPayload(
  config: MultiplierGrowthConfig,
): MultiplierGrowthPayload {
  const payload: MultiplierGrowthPayload = {
    growthBasisPointsPerSecond: config.growthBasisPointsPerSecond,
  };

  if (config.boostAfterGainedBasisPoints !== undefined) {
    payload.boostAfterGainedBasisPoints = config.boostAfterGainedBasisPoints;
  }

  if (config.boostGrowthBasisPointsPerSecond !== undefined) {
    payload.boostGrowthBasisPointsPerSecond =
      config.boostGrowthBasisPointsPerSecond;
  }

  if (config.highBoostAfterGainedBasisPoints !== undefined) {
    payload.highBoostAfterGainedBasisPoints =
      config.highBoostAfterGainedBasisPoints;
  }

  if (config.highGrowthBasisPointsPerSecond !== undefined) {
    payload.highGrowthBasisPointsPerSecond =
      config.highGrowthBasisPointsPerSecond;
  }

  return payload;
}

export function fromMultiplierGrowthPayload(
  payload: MultiplierGrowthPayload,
): MultiplierGrowthConfig {
  const config: MultiplierGrowthConfig = {
    growthBasisPointsPerSecond: payload.growthBasisPointsPerSecond,
  };

  if (payload.boostAfterGainedBasisPoints !== undefined) {
    config.boostAfterGainedBasisPoints = payload.boostAfterGainedBasisPoints;
  }

  if (payload.boostGrowthBasisPointsPerSecond !== undefined) {
    config.boostGrowthBasisPointsPerSecond =
      payload.boostGrowthBasisPointsPerSecond;
  }

  if (payload.highBoostAfterGainedBasisPoints !== undefined) {
    config.highBoostAfterGainedBasisPoints =
      payload.highBoostAfterGainedBasisPoints;
  }

  if (payload.highGrowthBasisPointsPerSecond !== undefined) {
    config.highGrowthBasisPointsPerSecond =
      payload.highGrowthBasisPointsPerSecond;
  }

  return config;
}
