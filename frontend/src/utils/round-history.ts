import type { CurrentRound, RoundHistoryItem } from "../services/api";

export function toRoundHistoryItem(
  round: Pick<
    CurrentRound,
    | "id"
    | "status"
    | "currentMultiplier"
    | "serverSeedHash"
    | "serverSeed"
    | "bettingStartedAt"
  >,
): RoundHistoryItem | null {
  if (round.status !== "CRASHED" && round.status !== "SETTLED") {
    return null;
  }

  return {
    id: round.id,
    crashPoint: round.currentMultiplier,
    serverSeedHash: round.serverSeedHash,
    serverSeed: round.serverSeed ?? null,
    createdAt: round.bettingStartedAt,
  };
}

export function shouldPreferLocalRound(
  local: CurrentRound,
  api: CurrentRound,
): boolean {
  if (local.id === api.id) {
    return false;
  }

  const localIsActive =
    local.status === "BETTING" || local.status === "RUNNING";
  const apiIsActive = api.status === "BETTING" || api.status === "RUNNING";

  return localIsActive && !apiIsActive;
}
