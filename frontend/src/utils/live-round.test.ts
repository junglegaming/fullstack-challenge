import { describe, expect, it } from "vitest";
import type { CurrentRound } from "../services/api";
import { pickLiveRound } from "./live-round";

const baseRound: CurrentRound = {
  id: "round-1",
  status: "BETTING",
  serverSeedHash: "hash",
  bettingStartedAt: "2026-01-01T00:00:00.000Z",
  bettingEndsAt: "2026-01-01T00:00:10.000Z",
  startedAt: null,
  crashedAt: null,
  currentMultiplier: "1.00",
  bets: [],
};

describe("pickLiveRound", () => {
  it("prefers RUNNING status from websocket over stale BETTING API snapshot", () => {
    const localRound: CurrentRound = {
      ...baseRound,
      status: "RUNNING",
      startedAt: "2026-01-01T00:00:10.000Z",
      currentMultiplier: "1.40",
    };

    expect(pickLiveRound(localRound, baseRound)).toEqual(localRound);
  });

  it("uses API RUNNING status when websocket snapshot is still BETTING", () => {
    const apiRound: CurrentRound = {
      ...baseRound,
      status: "RUNNING",
      startedAt: "2026-01-01T00:00:10.000Z",
      currentMultiplier: "1.40",
      bets: [
        {
          id: "bet-1",
          roundId: "round-1",
          playerId: "player-1",
          amountCents: "1000",
          status: "PLACED",
          cashOutMultiplier: null,
          payoutCents: null,
        },
      ],
    };

    expect(pickLiveRound(baseRound, apiRound)).toEqual(apiRound);
  });
});
