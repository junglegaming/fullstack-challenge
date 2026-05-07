import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGameStore } from "@/stores/game-store";
import wsService from "@/services/websocket";

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
  connected: false,
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket),
}));

describe("WebSocket Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.on.mockClear();
    mockSocket.connect.mockClear();
    mockSocket.disconnect.mockClear();
    mockSocket.removeAllListeners.mockClear();

    useGameStore.setState({
      currentRound: null,
      multiplier: 1.0,
      phase: "BETTING",
      bets: [],
      userBet: null,
      balance: 10000,
      roundHistory: [],
    });
  });

  it("should register event listeners on connect", () => {
    wsService.connect();
    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("round:started", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("round:multiplier_update", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("round:crashed", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("bet:placed", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("bet:cashed_out", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("wallet:updated", expect.any(Function));
  });

  it("should update state on round:started", () => {
    wsService.connect();
    const roundStartedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "round:started"
    )[1];

    roundStartedCallback({ roundId: "round-123", crashPoint: 2.5 });

    const state = useGameStore.getState();
    expect(state.currentRound).toEqual(
      expect.objectContaining({ id: "round-123", crashPoint: 2.5 })
    );
    expect(state.phase).toBe("BETTING");
    expect(state.bets).toEqual([]);
    expect(state.userBet).toBeNull();
  });

  it("should update multiplier on round:multiplier_update", () => {
    wsService.connect();
    const multiplierCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "round:multiplier_update"
    )[1];

    useGameStore.setState({ phase: "BETTING" });
    multiplierCallback({ multiplier: 1.5 });

    const state = useGameStore.getState();
    expect(state.multiplier).toBe(1.5);
    expect(state.phase).toBe("RUNNING");
  });

  it("should handle crash and update bets", () => {
    wsService.connect();
    const crashedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "round:crashed"
    )[1];

    useGameStore.setState({
      phase: "RUNNING",
      bets: [
        { betId: "b1", playerId: "p1", amountCents: 1000, status: "PENDING" },
        { betId: "b2", playerId: "p2", amountCents: 500, status: "PENDING" },
      ],
      userBet: {
        betId: "b1", playerId: "p1", amountCents: 1000, status: "PENDING",
      },
    });

    crashedCallback({ crashPoint: 1.8 });

    const state = useGameStore.getState();
    expect(state.phase).toBe("CRASHED");
    expect(state.bets[0].status).toBe("LOST");
    expect(state.bets[1].status).toBe("LOST");
    expect(state.userBet?.status).toBe("LOST");
    // History is added via setTimeout in the ws service, so we don't test it here
  });

  it("should add bet on bet:placed", () => {
    wsService.connect();
    const betPlacedCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "bet:placed"
    )[1];

    betPlacedCallback({ betId: "new-bet", playerId: "player", amountCents: 5000 });

    const state = useGameStore.getState();
    expect(state.bets).toHaveLength(1);
    expect(state.bets[0].betId).toBe("new-bet");
    expect(state.userBet?.betId).toBe("new-bet");
  });

  it("should handle cashout on bet:cashed_out", () => {
    wsService.connect();
    const cashedOutCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "bet:cashed_out"
    )[1];

    useGameStore.setState({
      bets: [
        { betId: "b1", playerId: "player", amountCents: 1000, status: "PENDING" },
      ],
      userBet: {
        betId: "b1", playerId: "player", amountCents: 1000, status: "PENDING",
      },
      balance: 10000,
    });

    cashedOutCallback({
      betId: "b1",
      playerId: "player",
      multiplier: 3.0,
      payoutCents: 3000,
    });

    const state = useGameStore.getState();
    expect(state.bets[0].status).toBe("CASHED_OUT");
    expect(state.userBet?.status).toBe("CASHED_OUT");
    expect(state.userBet?.cashoutMultiplier).toBe(3.0);
    expect(state.balance).toBe(10000 + 3000);
  });

  it("should update balance on wallet:updated", () => {
    wsService.connect();
    const walletCallback = mockSocket.on.mock.calls.find(
      (call) => call[0] === "wallet:updated"
    )[1];

    walletCallback({ balanceCents: 50000 });

    const state = useGameStore.getState();
    expect(state.balance).toBe(50000);
  });

  it("should disconnect properly", () => {
    wsService.connect();
    wsService.disconnect();
    expect(mockSocket.removeAllListeners).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
