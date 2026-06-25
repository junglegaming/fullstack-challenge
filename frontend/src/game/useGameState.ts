import { useEffect, useReducer, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { WS_URL } from "../config";
import { api } from "../api/client";
import type { GameEvent } from "../realtime/events";
import {
  initialState,
  reducer,
  type GameState,
  type HistoryItem,
} from "./gameState";

interface UseGameState {
  state: GameState;
  connected: boolean;
}

export function useGameState(): UseGameState {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .getCurrentRound()
      .then((round) => {
        if (!cancelled) {
          dispatch({ kind: "seedRound", round });
        }
      })
      .catch((err) => console.error("Falha ao buscar a rodada atual", err));

    api
      .getHistory(1, 30)
      .then((page) => {
        if (cancelled) {
          return;
        }
        const items: HistoryItem[] = page.items
          .filter((r) => r.crashPoint != null)
          .map((r) => ({
            roundId: r.id,
            crashPoint: r.crashPoint as number,
            nonce: r.nonce,
          }));
        dispatch({ kind: "seedHistory", items });
      })
      .catch((err) => console.error("Falha ao buscar o histórico", err));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket: Socket = io(WS_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("game.event", (event: GameEvent) => {
      dispatch({ kind: "event", event });
    });

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, []);

  return { state, connected };
}
