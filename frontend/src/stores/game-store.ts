import { create } from "zustand";
import type { BetSummary, CurrentRound, RoundHistoryItem } from "../services/api";

export type MultiplierTickSnapshot = {
  multiplier: string;
  at: number;
};

type GameState = {
  connected: boolean;
  latestMultiplierTick: MultiplierTickSnapshot | null;
  currentRound: CurrentRound | null;
  roundBets: BetSummary[];
  history: RoundHistoryItem[];
  setConnected: (connected: boolean) => void;
  applyMultiplierTick: (multiplier: string, occurredAt: string) => void;
  resetMultiplierTicks: () => void;
  setCurrentRound: (round: CurrentRound | null) => void;
  setRoundBets: (bets: BetSummary[]) => void;
  upsertBet: (bet: BetSummary) => void;
  setHistory: (items: RoundHistoryItem[]) => void;
};

export const useGameStore = create<GameState>((set) => ({
  connected: false,
  latestMultiplierTick: null,
  currentRound: null,
  roundBets: [],
  history: [],
  setConnected: (connected) => set({ connected }),
  applyMultiplierTick: (multiplier, occurredAt) =>
    set((state) => ({
      latestMultiplierTick: {
        multiplier,
        at: new Date(occurredAt).getTime(),
      },
      currentRound: state.currentRound
        ? { ...state.currentRound, currentMultiplier: multiplier }
        : null,
    })),
  resetMultiplierTicks: () => set({ latestMultiplierTick: null }),
  setCurrentRound: (currentRound) =>
    set((state) => {
      const isRunning = currentRound?.status === "RUNNING";

      return {
        currentRound,
        roundBets: currentRound?.bets ?? [],
        latestMultiplierTick: isRunning ? state.latestMultiplierTick : null,
      };
    }),
  setRoundBets: (roundBets) => set({ roundBets }),
  upsertBet: (bet) =>
    set((state) => {
      const existing = state.roundBets.some((item) => item.id === bet.id);
      return {
        roundBets: existing
          ? state.roundBets.map((item) => (item.id === bet.id ? bet : item))
          : [bet, ...state.roundBets],
      };
    }),
  setHistory: (history) => set({ history }),
}));
