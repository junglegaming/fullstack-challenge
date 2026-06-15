import type { QueryClient } from "@tanstack/react-query";
import type { Paginated, RoundHistoryItem } from "../services/api";
import { getRoundHistory } from "../services/api";

export const ROUND_HISTORY_QUERY_KEY = ["rounds", "history"] as const;
export const ROUND_HISTORY_PAGE_SIZE = 20;

export const roundHistoryQueryOptions = {
  queryKey: ROUND_HISTORY_QUERY_KEY,
  queryFn: getRoundHistory,
  staleTime: 0,
};

export type RoundCrashedEvent = {
  roundId: string;
  crashPoint: string;
  crashedAt: string;
  serverSeed: string;
  serverSeedHash: string;
  bettingStartedAt?: string;
};

export function toHistoryItemFromCrashEvent(
  payload: RoundCrashedEvent,
): RoundHistoryItem {
  return {
    id: payload.roundId,
    crashPoint: payload.crashPoint,
    serverSeedHash: payload.serverSeedHash,
    serverSeed: payload.serverSeed,
    createdAt: payload.bettingStartedAt ?? payload.crashedAt,
  };
}

export function prependRoundHistoryCache(
  queryClient: QueryClient,
  item: RoundHistoryItem,
): void {
  queryClient.setQueryData<Paginated<RoundHistoryItem>>(
    ROUND_HISTORY_QUERY_KEY,
    (current) => prependRoundHistoryPage(current, item),
  );
}

export function prependRoundHistoryPage(
  current: Paginated<RoundHistoryItem> | undefined,
  item: RoundHistoryItem,
): Paginated<RoundHistoryItem> {
  if (!current) {
    return {
      items: [item],
      page: 1,
      pageSize: ROUND_HISTORY_PAGE_SIZE,
      total: 1,
    };
  }

  if (current.items.some((round) => round.id === item.id)) {
    return current;
  }

  return {
    ...current,
    items: [item, ...current.items].slice(0, ROUND_HISTORY_PAGE_SIZE),
    total: current.total + 1,
  };
}
