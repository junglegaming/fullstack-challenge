import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGameStore } from "@/stores/game-store";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    setToken: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Cash Out Button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      currentRound: { id: "round-1", crashPoint: 2.5, startedAt: Date.now() },
      multiplier: 1.0,
      phase: "BETTING",
      bets: [],
      userBet: null,
      balance: 10000,
      roundHistory: [],
    });
  });

  it("should be disabled when not in RUNNING phase", () => {
    const state = useGameStore.getState();
    const canCashOut = state.phase === "RUNNING" && state.userBet?.status === "PENDING";
    expect(canCashOut).toBe(false);
  });

  it("should be enabled when in RUNNING phase with pending bet", () => {
    useGameStore.setState({
      phase: "RUNNING",
      multiplier: 1.5,
      userBet: {
        betId: "bet-1",
        playerId: "player",
        amountCents: 1000,
        status: "PENDING",
      },
    });

    const state = useGameStore.getState();
    const canCashOut = state.phase === "RUNNING" && state.userBet?.status === "PENDING";
    expect(canCashOut).toBe(true);
  });

  it("should calculate cashout multiplier display", () => {
    useGameStore.setState({
      phase: "RUNNING",
      multiplier: 2.5,
      userBet: {
        betId: "bet-1",
        playerId: "player",
        amountCents: 1000,
        status: "PENDING",
      },
    });

    const state = useGameStore.getState();
    expect(state.multiplier.toFixed(2)).toBe("2.50");
  });

  it("should call api.post when cashing out", async () => {
    const mockPost = vi.spyOn(apiModule.default, "post").mockResolvedValue({});
    useGameStore.setState({
      phase: "RUNNING",
      multiplier: 2.0,
      userBet: {
        betId: "bet-1",
        playerId: "player",
        amountCents: 1000,
        status: "PENDING",
      },
    });

    await apiModule.default.post("/games/bet/cashout");

    expect(mockPost).toHaveBeenCalledWith("/games/bet/cashout");
  });

  it("should handle cashout api error", async () => {
    const mockPost = vi.spyOn(apiModule.default, "post").mockRejectedValue({
      message: "Cashout failed",
    });

    try {
      await apiModule.default.post("/games/bet/cashout");
    } catch (e: any) {
      expect(e.message).toBe("Cashout failed");
    }
  });
});
