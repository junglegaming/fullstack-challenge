import { io, type Socket } from "socket.io-client";
import { useGameStore } from "@/stores/game-store";

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000",
      {
        path: "/ws/game",
        transports: ["websocket"],
        autoConnect: true,
      },
    );

    const store = useGameStore.getState();

    this.socket.on("connect", () => {
      console.log("[WS] Connected");
    });

    this.socket.on("round:started", (data) => {
      store.setStatus("RUNNING");
      store.resetBets();
      store.setMultiplier(1.0);
      store.setCrashPoint(data.crashPoint ?? null);
    });

    this.socket.on("round:multiplier_update", (data) => {
      store.setMultiplier(data.multiplier);
      store.setStatus("RUNNING");
    });

    this.socket.on("round:crashed", (data) => {
      store.setStatus("CRASHED");
      store.setCrashPoint(data.crashPoint ?? null);
    });

    this.socket.on("bet:placed", (data) => {
      store.addBet({
        betId: data.betId,
        playerId: data.playerId,
        amountCents: data.amountCents,
        status: "ACTIVE",
      });
    });

    this.socket.on("bet:cashed_out", (data) => {
      store.updateBet(data.betId, {
        status: "CASHED_OUT",
        cashoutMultiplier: data.multiplier,
      });
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
