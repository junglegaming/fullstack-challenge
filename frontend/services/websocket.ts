import { io, type Socket } from "socket.io-client";
import { useGameStore } from "@/stores/game-store";

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000",
      {
        transports: ["websocket"],
        autoConnect: true,
      },
    );

    const store = useGameStore.getState();

    this.socket.on("connect", () => {
      console.log("[WS] Connected");
    });

    this.socket.on("round:started", (data) => {
      store.setRound({
        id: data.roundId,
        crashPoint: data.crashPoint,
        startedAt: Date.now(),
      });
      store.setPhase("BETTING");
      store.updateMultiplier(1.0);
      // Clear previous round bets
      useGameStore.setState({ bets: [], userBet: null });
    });

    this.socket.on("round:multiplier_update", (data) => {
      store.updateMultiplier(data.multiplier);
      store.setPhase("RUNNING");
    });

    this.socket.on("round:crashed", (data) => {
      store.setPhase("CRASHED");
      // Update crash point in round if not already set
      const currentRound = useGameStore.getState().currentRound;
      if (currentRound && !currentRound.crashPoint) {
        store.setRound({
          ...currentRound,
          crashPoint: data.crashPoint,
        });
      }
    });

    this.socket.on("bet:placed", (data) => {
      store.addBet({
        betId: data.betId,
        playerId: data.playerId,
        amountCents: data.amountCents,
        status: "PENDING",
      });
    });

    this.socket.on("bet:cashed_out", (data) => {
      store.cashoutBet(data.betId, data.multiplier);
    });

    this.socket.on("disconnect", () => {
      console.log("[WS] Disconnected");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const wsService = new WebSocketService();
export default wsService;
