export const GAME_ROUND_ENGINE_CONFIG = Symbol("GAME_ROUND_ENGINE_CONFIG");

export type GameRoundEngineConfig = {
  bettingPhaseMs: number;
  settlementDelayMs: number;
  tickIntervalMs: number;
  multiplierGrowthBasisPointsPerSecond: number;
  autoStart: boolean;
};

export function resolveGameRoundEngineConfig(): GameRoundEngineConfig {
  return {
    bettingPhaseMs: readPositiveInteger("GAME_BETTING_PHASE_MS", 10_000),
    settlementDelayMs: readPositiveInteger("GAME_SETTLEMENT_DELAY_MS", 3_000),
    tickIntervalMs: readPositiveInteger("GAME_ENGINE_TICK_MS", 250),
    multiplierGrowthBasisPointsPerSecond: readPositiveInteger(
      "GAME_MULTIPLIER_GROWTH_BPS_PER_SECOND",
      100,
    ),
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
