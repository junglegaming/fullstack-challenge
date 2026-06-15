import type { CurrentRound } from "../services/api";
import { mergeRoundBets } from "./active-bet";
import { shouldPreferLocalRound } from "./round-history";

const ROUND_STATUS_RANK: Record<CurrentRound["status"], number> = {
  BETTING: 1,
  RUNNING: 2,
  CRASHED: 3,
  SETTLED: 4,
};

export function pickLiveRound(
  localRound: CurrentRound | null,
  apiRound: CurrentRound | undefined,
): CurrentRound | null {
  if (!apiRound) {
    return localRound;
  }

  if (!localRound) {
    return apiRound;
  }

  if (localRound.id !== apiRound.id) {
    return shouldPreferLocalRound(localRound, apiRound) ? localRound : apiRound;
  }

  const localRank = ROUND_STATUS_RANK[localRound.status] ?? 0;
  const apiRank = ROUND_STATUS_RANK[apiRound.status] ?? 0;
  const preferredStatus = localRank >= apiRank ? localRound.status : apiRound.status;

  return {
    ...apiRound,
    status: preferredStatus,
    startedAt: localRound.startedAt ?? apiRound.startedAt,
    crashedAt: localRound.crashedAt ?? apiRound.crashedAt,
    currentMultiplier:
      localRound.status === "RUNNING"
        ? localRound.currentMultiplier
        : localRank >= apiRank
          ? localRound.currentMultiplier
          : apiRound.currentMultiplier,
    serverSeed: localRound.serverSeed ?? apiRound.serverSeed,
    bets: mergeRoundBets(apiRound.bets, localRound.bets, apiRound.id),
  };
}

export function mergeRoundSnapshot(
  localRound: CurrentRound | null,
  apiRound: CurrentRound,
): CurrentRound {
  return pickLiveRound(localRound, apiRound) ?? apiRound;
}
