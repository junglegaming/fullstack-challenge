import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  prependRoundHistoryCache,
  prependRoundHistoryPage,
  ROUND_HISTORY_QUERY_KEY,
} from "./round-history";
import type { RoundHistoryItem } from "../services/api";

const sampleItem: RoundHistoryItem = {
  id: "round-1",
  crashPoint: "2.10",
  serverSeedHash: "hash-1",
  serverSeed: "seed-1",
  createdAt: "2026-06-15T12:00:00.000Z",
};

describe("round history query cache", () => {
  it("prepends a new item to an empty cache page", () => {
    const next = prependRoundHistoryPage(undefined, sampleItem);

    expect(next.items).toEqual([sampleItem]);
    expect(next.total).toBe(1);
  });

  it("deduplicates items by round id", () => {
    const current = prependRoundHistoryPage(undefined, sampleItem);
    const next = prependRoundHistoryPage(current, sampleItem);

    expect(next).toBe(current);
  });

  it("updates react query cache subscribers immediately", () => {
    const queryClient = new QueryClient();
    prependRoundHistoryCache(queryClient, sampleItem);

    expect(
      queryClient.getQueryData<{ items: RoundHistoryItem[] }>(
        ROUND_HISTORY_QUERY_KEY,
      )?.items,
    ).toEqual([sampleItem]);
  });
});
