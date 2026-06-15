import { describe, expect, it } from "vitest";
import { pickLiveRound } from "./live-round";
import { shouldPreferLocalRound, toRoundHistoryItem } from "./round-history";
import { mockBettingRound } from "../test/fixtures";

describe("round history sync", () => {
  it("builds a history item from a crashed round", () => {
    const item = toRoundHistoryItem({
      ...mockBettingRound,
      status: "CRASHED",
      currentMultiplier: "2.45",
      serverSeed: "revealed-seed",
    });

    expect(item).toEqual({
      id: mockBettingRound.id,
      crashPoint: "2.45",
      serverSeedHash: mockBettingRound.serverSeedHash,
      serverSeed: "revealed-seed",
      createdAt: mockBettingRound.bettingStartedAt,
    });
  });

  it("ignores active rounds", () => {
    expect(toRoundHistoryItem(mockBettingRound)).toBeNull();
  });

  it("prefers websocket round when api is still on the previous round", () => {
    const localRound = {
      ...mockBettingRound,
      id: "next-round",
      status: "RUNNING" as const,
      startedAt: "2026-06-15T12:00:05.000Z",
    };
    const apiRound = {
      ...mockBettingRound,
      status: "SETTLED" as const,
      currentMultiplier: "1.42",
    };

    expect(shouldPreferLocalRound(localRound, apiRound)).toBe(true);
    expect(pickLiveRound(localRound, apiRound)?.id).toBe("next-round");
  });
});
