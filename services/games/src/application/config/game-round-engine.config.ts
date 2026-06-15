import type { MultiplierGrowthConfig } from "../../domain/services/multiplier-growth";

export const GAME_ROUND_ENGINE_CONFIG = Symbol("GAME_ROUND_ENGINE_CONFIG");

export type GameRoundEngineConfig = {
  bettingPhaseMs: number;
  settlementDelayMs: number;
  tickIntervalMs: number;
  multiplierGrowth: MultiplierGrowthConfig;
  autoStart: boolean;
};

export function resolveMultiplierGrowthConfig(): MultiplierGrowthConfig {
  const config: MultiplierGrowthConfig = {
    growthBasisPointsPerSecond: readPositiveInteger(
      "GAME_MULTIPLIER_GROWTH_BPS_PER_SECOND",
      100,
    ),
  };

  const boostAfterGainedBasisPoints = readOptionalPositiveInteger(
    "GAME_MULTIPLIER_BOOST_AFTER_GAINED_BPS",
  );
  const boostGrowthBasisPointsPerSecond = readOptionalPositiveInteger(
    "GAME_MULTIPLIER_BOOST_GROWTH_BPS_PER_SECOND",
  );
  const highBoostAfterGainedBasisPoints = readOptionalPositiveInteger(
    "GAME_MULTIPLIER_HIGH_BOOST_AFTER_GAINED_BPS",
  );
  const highGrowthBasisPointsPerSecond = readOptionalPositiveInteger(
    "GAME_MULTIPLIER_HIGH_GROWTH_BPS_PER_SECOND",
  );

  if (boostAfterGainedBasisPoints !== undefined) {
    config.boostAfterGainedBasisPoints = boostAfterGainedBasisPoints;
  }

  if (boostGrowthBasisPointsPerSecond !== undefined) {
    config.boostGrowthBasisPointsPerSecond = boostGrowthBasisPointsPerSecond;
  }

  if (highBoostAfterGainedBasisPoints !== undefined) {
    config.highBoostAfterGainedBasisPoints = highBoostAfterGainedBasisPoints;
  }

  if (highGrowthBasisPointsPerSecond !== undefined) {
    config.highGrowthBasisPointsPerSecond = highGrowthBasisPointsPerSecond;
  }

  return config;
}

export function resolveGameRoundEngineConfig(): GameRoundEngineConfig {
  return {
    bettingPhaseMs: readPositiveInteger("GAME_BETTING_PHASE_MS", 10_000),
    settlementDelayMs: readPositiveInteger("GAME_SETTLEMENT_DELAY_MS", 3_000),
    tickIntervalMs: readPositiveInteger("GAME_ENGINE_TICK_MS", 250),
    multiplierGrowth: resolveMultiplierGrowthConfig(),
    autoStart: process.env.GAME_ROUND_ENGINE_ENABLED !== "false",
  };
}

function readPositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function readOptionalPositiveInteger(name: string): number | undefined {
  const rawValue = process.env[name];

  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}
