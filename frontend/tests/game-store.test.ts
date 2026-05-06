import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/stores/game-store";

describe("Game Store", () => {
  beforeEach(() => {
    // Reset store before each test
    useGameStore.setState({
      currentRound: null,
      multiplier: 1.0,
      phase: "BETTING",
      bets: [],
      userBet: null,
      balance: 0,
      roundHistory: [],
    });
  });

  it("should have initial state", () => {
    const state = useGameStore.getState();
    expect(state.multiplier).toBe(1.0);
    expect(state.phase).toBe("BETTING");
    expect(state.bets).toEqual([]);
    expect(state.userBet).toBeNull();
    expect(state.balance).toBe(0);
  });

  it("should place a bet", () => {
    const bet = {
      betId: "bet-1",
      playerId: "player",
      amountCents: 1000,
      status: "PENDING" as const,
    };

    useGameStore.getState().addBet(bet);

    const state = useGameStore.getState();
    expect(state.bets).toHaveLength(1);
    expect(state.bets[0].betId).toBe("bet-1");
    expect(state.userBet).toEqual(expect.objectContaining({ betId: "bet-1" }));
  });

  it("should cash out a bet", () => {
    const betId = "bet-1";
    useGameStore.setState({
      bets: [
        { betId, playerId: "player", amountCents: 1000, status: "PENDING" as const },
      ],
      userBet: {
        betId, playerId: "player", amountCents: 1000,
        status: "PENDING" as const,
      },
      balance: 5000,
    });

    useGameStore.getState().cashoutBet(betId, 2.5);

    const state = useGameStore.getState();
    expect(state.bets[0].status).toBe("CASHED_OUT");
    expect(state.userBet?.status).toBe("CASHED_OUT");
    expect(state.balance).toBe(5000 + 2500); // 1000 * 2.5
  });

  it("should reset for new round", () => {
    useGameStore.setState({
      multiplier: 3.5,
      phase: "RUNNING",
      bets: [{ betId: "b1", playerId: "p1", amountCents: 100, status: "PENDING" as const }],
      userBet: { betId: "b1", playerId: "p1", amountCents: 100, status: "PENDING" as const },
    });

    useGameStore.getState().resetForNewRound();

    const state = useGameStore.getState();
    expect(state.multiplier).toBe(1.0);
    expect(state.phase).toBe("BETTING");
    expect(state.bets).toEqual([]);
    expect(state.userBet).toBeNull();
  });

  it("should add round to history", () => {
    useGameStore.setState({ roundHistory: [] });

    useGameStore.getState().addRoundToHistory(2.5);
    useGameStore.getState().addRoundToHistory(1.8);
    useGameStore.getState().addRoundToHistory(5.0);

    const state = useGameStore.getState();
    expect(state.roundHistory).toEqual([5.0, 1.8, 2.5]);
    expect(state.roundHistory).toHaveLength(3);
  });

  it("should limit history to 10 entries", () => {
    // Create array with exactly 10 items: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const history = Array.from({ length: 10 }, (_, i) => i + 1);
    useGameStore.setState({ roundHistory: history });

    // Add new item - should push out the last (10) since new item goes to front
    useGameStore.getState().addRoundToHistory(99.9);

    const state = useGameStore.getState();
    expect(state.roundHistory).toHaveLength(10);
    expect(state.roundHistory[0]).toBe(99.9); // New item at front
    // After adding 99.9 to front: [99.9, 1, 2, 3, 4, 5, 6, 7, 8, 9] - so 10 is pushed out
    expect(state.roundHistory).not.toContain(10);
  });

  it("should update balance", () => {
    useGameStore.getState().setBalance(10000);
    expect(useGameStore.getState().balance).toBe(10000);
  });
});
