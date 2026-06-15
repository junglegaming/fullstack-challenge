export const ROUND_BETTING_STARTED = "round.betting_started";
export const ROUND_STARTED = "round.started";
export const ROUND_MULTIPLIER_TICK = "round.multiplier_tick";
export const BET_ACCEPTED = "bet.accepted";
export const BET_CASHED_OUT = "bet.cashed_out";
export const ROUND_CRASHED = "round.crashed";
export const ROUND_SETTLED = "round.settled";

export type RoundBettingStartedPayload = {
  roundId: string;
  serverSeedHash: string;
  bettingStartedAt: string;
  bettingEndsAt: string;
};

export type MultiplierGrowthPayload = {
  growthBasisPointsPerSecond: number;
  boostAfterGainedBasisPoints?: number;
  boostGrowthBasisPointsPerSecond?: number;
  highBoostAfterGainedBasisPoints?: number;
  highGrowthBasisPointsPerSecond?: number;
};

export type RoundStartedPayload = {
  roundId: string;
  startedAt: string;
  serverTime: string;
  serverSeedHash: string;
  baseMultiplier: string;
  multiplierGrowth: MultiplierGrowthPayload;
};

export type RoundMultiplierTickPayload = {
  roundId: string;
  multiplier: string;
  occurredAt: string;
};

export type BetAcceptedPayload = {
  roundId: string;
  betId: string;
  playerId: string;
  amountCents: string;
};

export type BetCashedOutPayload = {
  roundId: string;
  betId: string;
  playerId: string;
  cashOutMultiplier: string;
  payoutCents: string;
};

export type RoundCrashedPayload = {
  roundId: string;
  crashPoint: string;
  crashedAt: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
};

export type RoundSettledPayload = {
  roundId: string;
  lostBetsCount: number;
  cashedOutBetsCount: number;
  totalBetCents: string;
  totalPayoutCents: string;
};
