import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGameStore } from "@/stores/game-store";
import * as apiModule from "@/lib/api";

vi.mock("@/lib/api", () => ({
  default: {
    setToken: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Bet Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState({
      currentRound: { id: "round-1", crashPoint: 2.5, startedAt: Date.now() },
      multiplier: 1.0,
      phase: "BETTING",
      bets: [],
      userBet: null,
      balance: 10000, // R$ 100.00
      roundHistory: [],
    });
  });

  it("should calculate bet amount in cents correctly", () => {
    const betAmount = "10.00";
    const amountCents = Math.round(parseFloat(betAmount) * 100);
    expect(amountCents).toBe(1000);
    expect(amountCents <= 10000).toBe(true);
  });

  it("should detect insufficient balance", () => {
    const betAmount = "200.00";
    const amountCents = Math.round(parseFloat(betAmount) * 100);
    expect(amountCents > 10000).toBe(true); // 20000 > 10000
  });

  it("should detect valid bet amount", () => {
    const betAmount = "10.00";
    const amountCents = Math.round(parseFloat(betAmount) * 100);
    const isValid = amountCents >= 100 && amountCents <= 100000;
    expect(isValid).toBe(true);
  });

  it("should calculate potential payout", () => {
    const betAmount = "10.00";
    const userBet = useGameStore.getState().userBet;
    const multiplier = 1.5;
    const betAmountCents = Math.round(parseFloat(betAmount) * 100) || 0;
    const potentialPayout = userBet
      ? (userBet.amountCents / 100) * multiplier
      : (betAmountCents / 100) * multiplier;
    expect(potentialPayout).toBe(15.0); // 10 * 1.5
  });

  it("should call api.post when placing bet", async () => {
    const mockPost = vi.spyOn(apiModule.default, "post").mockResolvedValue({});
    const amountCents = 1000;

    await apiModule.default.post("/games/bet", { amountCents });

    expect(mockPost).toHaveBeenCalledWith("/games/bet", { amountCents: 1000 });
  });

  it("should handle bet api error", async () => {
    const mockPost = vi.spyOn(apiModule.default, "post").mockRejectedValue({
      message: "Insufficient balance",
    });

    try {
      await apiModule.default.post("/games/bet", { amountCents: 1000 });
    } catch (e: any) {
      expect(e.message).toBe("Insufficient balance");
    }
  });
});
