import { io, type Socket } from "socket.io-client";
import { useGameStore } from "@/stores/game-store";
import type { Bet, UserBet } from "@/stores/game-store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(WS_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;
    const store = useGameStore.getState();

    this.socket.on("connect", () => {
      console.log("[WS] Connected:", this.socket?.id);
    });

    this.socket.on("round:started", (data: { roundId: string; crashPoint: number }) => {
      useGameStore.setState({
        currentRound: {
          id: data.roundId,
          crashPoint: data.crashPoint,
          startedAt: Date.now(),
        },
        multiplier: 1.0,
        phase: "BETTING",
        bets: [],
        userBet: null,
      });
    });

    this.socket.on("round:multiplier_update", (data: { multiplier: number }) => {
      useGameStore.setState({
        multiplier: data.multiplier,
        phase: "RUNNING",
      });
    });

    this.socket.on("round:crashed", (data: { crashPoint: number }) => {
      const state = useGameStore.getState();
      useGameStore.setState({
        phase: "CRASHED",
        currentRound: state.currentRound
          ? { ...state.currentRound, crashPoint: data.crashPoint }
          : null,
        bets: state.bets.map((b) =>
          b.status === "PENDING" ? { ...b, status: "LOST" as const } : b,
        ),
        userBet:
          state.userBet?.status === "PENDING"
            ? { ...state.userBet, status: "LOST" as const }
            : state.userBet,
      });
      useGameStore.getState().addRoundToHistory(data.crashPoint);
    });

    this.socket.on(
      "bet:placed",
      (data: { betId: string; playerId: string; amountCents: number }) => {
        const newBet: Bet = {
          betId: data.betId,
          playerId: data.playerId,
          amountCents: data.amountCents,
          status: "PENDING",
        };
        useGameStore.setState((state) => ({
          bets: [...state.bets, newBet],
          userBet:
            data.playerId === "player"
              ? { ...newBet, payoutCents: undefined }
              : state.userBet,
        }));
      },
    );

    this.socket.on(
      "bet:cashed_out",
      (data: {
        betId: string;
        playerId: string;
        multiplier: number;
        payoutCents: number;
      }) => {
        const { betId, multiplier, payoutCents } = data;
        const state = useGameStore.getState();
        const isUserBet = state.userBet?.betId === betId;

        // Update bets array
        const updatedBets = state.bets.map((b) =>
          b.betId === betId
            ? { ...b, status: "CASHED_OUT" as const, cashoutMultiplier: multiplier }
            : b,
        );

        // Update userBet if it's the user's bet
        const updatedUserBet: UserBet | null = isUserBet
          ? {
              betId: state.userBet!.betId,
              playerId: state.userBet!.playerId,
              amountCents: state.userBet!.amountCents,
              status: "CASHED_OUT" as const,
              cashoutMultiplier: multiplier,
              payoutCents,
            }
          : state.userBet;

        useGameStore.setState({
          bets: updatedBets,
          userBet: updatedUserBet,
          balance: isUserBet ? state.balance + payoutCents : state.balance,
        });
      },
    );

    this.socket.on("disconnect", (reason: string) => {
      console.log("[WS] Disconnected:", reason);
    });

    this.socket.on("reconnect", (attempt: number) => {
      console.log("[WS] Reconnected after", attempt, "attempts");
    });

    this.socket.on("reconnect_attempt", () => {
      console.log("[WS] Attempting reconnection...");
    });

    this.socket.on("reconnect_failed", () => {
      console.error("[WS] Reconnection failed after max attempts");
    });

    this.socket.on("wallet:updated", (data: { balanceCents: number }) => {
      useGameStore.setState({ balance: data.balanceCents });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const wsService = new WebSocketService();

export function useGameSocket() {
  const connect = () => wsService.connect();
  const disconnect = () => wsService.disconnect();

  return { connect, disconnect };
}

export default wsService;
