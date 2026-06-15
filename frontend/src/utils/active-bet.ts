import type { BetSummary } from "../services/api";

const BET_STATUS_PRIORITY: Record<string, number> = {
  PLACED: 100,
  PENDING_DEBIT: 50,
  CASHED_OUT: 10,
  LOST: 5,
  REJECTED: 0,
};

export function pickPreferredBet(
  left: BetSummary | undefined,
  right: BetSummary,
): BetSummary {
  if (!left) {
    return right;
  }

  const leftPriority = BET_STATUS_PRIORITY[left.status] ?? 0;
  const rightPriority = BET_STATUS_PRIORITY[right.status] ?? 0;

  return rightPriority >= leftPriority ? right : left;
}

export function mergeRoundBets(
  apiBets: BetSummary[],
  localBets: BetSummary[],
  roundId: string | undefined,
): BetSummary[] {
  if (!roundId) {
    return apiBets;
  }

  const merged = new Map<string, BetSummary>();

  for (const bet of apiBets) {
    merged.set(bet.id, bet);
  }

  for (const bet of localBets) {
    if (bet.roundId !== roundId) {
      continue;
    }

    merged.set(bet.id, pickPreferredBet(merged.get(bet.id), bet));
  }

  return [...merged.values()];
}

export function resolveMyActiveBet(
  currentRoundId: string | undefined,
  playerId: string | undefined,
  myBets: BetSummary[] | undefined,
  roundBets: BetSummary[],
  currentRoundBets: BetSummary[] = [],
): BetSummary | undefined {
  if (!currentRoundId) {
    return undefined;
  }

  const candidates = [
    ...(myBets?.filter((bet) => bet.roundId === currentRoundId) ?? []),
    ...currentRoundBets.filter((bet) => bet.roundId === currentRoundId),
    ...roundBets.filter((bet) => bet.roundId === currentRoundId),
  ];

  const mergedById = new Map<string, BetSummary>();

  for (const bet of candidates) {
    if (playerId && bet.playerId && bet.playerId !== playerId) {
      continue;
    }

    mergedById.set(bet.id, pickPreferredBet(mergedById.get(bet.id), bet));
  }

  const merged = [...mergedById.values()].sort(
    (left, right) =>
      (BET_STATUS_PRIORITY[right.status] ?? 0) -
      (BET_STATUS_PRIORITY[left.status] ?? 0),
  );

  return merged.find((bet) => bet.status === "PLACED") ?? merged[0];
}
