import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVisualMultiplier } from "./useVisualMultiplier";
import type { CurrentRound } from "../services/api";
import { useGameStore } from "../stores/game-store";

const startedAt = "2026-01-01T00:00:10.000Z";

const runningRound: CurrentRound = {
  id: "round-1",
  status: "RUNNING",
  serverSeedHash: "hash",
  bettingStartedAt: "2026-01-01T00:00:00.000Z",
  bettingEndsAt: startedAt,
  startedAt,
  crashedAt: null,
  currentMultiplier: "1.00",
  multiplierGrowth: {
    growthBasisPointsPerSecond: 40,
    boostAfterGainedBasisPoints: 100,
    boostGrowthBasisPointsPerSecond: 2000,
  },
  bets: [],
};

describe("useVisualMultiplier", () => {
  beforeEach(() => {
    useGameStore.setState({
      latestMultiplierTick: null,
      serverTimeOffsetMs: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to round multiplier when animation context is unavailable", () => {
    const { result } = renderHook(() =>
      useVisualMultiplier({
        ...runningRound,
        multiplierGrowth: undefined,
        currentMultiplier: "2.50",
      }),
    );

    expect(result.current).toBe("2.50");
  });

  it("advances smoothly in 0.01 steps instead of websocket tick jumps", async () => {
    const startedAtMs = new Date(startedAt).getTime();

    vi.spyOn(Date, "now").mockReturnValue(startedAtMs + 275);
    useGameStore.setState({
      serverTimeOffsetMs: 0,
      latestMultiplierTick: {
        multiplier: "1.10",
        at: startedAtMs + 250,
      },
    });

    const { result } = renderHook(() => useVisualMultiplier(runningRound));

    await waitFor(() => {
      expect(result.current).toBe("1.11");
    });
  });

  it("returns static multiplier for non-running rounds", () => {
    const { result } = renderHook(() =>
      useVisualMultiplier({
        ...runningRound,
        status: "CRASHED",
        currentMultiplier: "3.45",
      }),
    );

    expect(result.current).toBe("3.45");
  });
});
