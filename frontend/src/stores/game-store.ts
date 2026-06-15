import { create } from "zustand";
import type { BetSummary, CurrentRound, RoundHistoryItem } from "../services/api";

type GameState = {
  connected: boolean;
  visualMultiplier: string;
  currentRound: CurrentRound | null;
  roundBets: BetSummary[];
  history: RoundHistoryItem[];
  setConnected: (connected: boolean) => void;
  setVisualMultiplier: (multiplier: string) => void;
  setCurrentRound: (round: CurrentRound | null) => void;
  setRoundBets: (bets: BetSummary[]) => void;
  upsertBet: (bet: BetSummary) => void;
  setHistory: (items: RoundHistoryItem[]) => void;
};

export const useGameStore = create<GameState>((set) => ({
  connected: false,
  visualMultiplier: "1.00",
  currentRound: null,
  roundBets: [],
  history: [],
  setConnected: (connected) => set({ connected }),
  setVisualMultiplier: (visualMultiplier) => set({ visualMultiplier }),
  setCurrentRound: (currentRound) =>
    set({
      currentRound,
      roundBets: currentRound?.bets ?? [],
      visualMultiplier: currentRound?.currentMultiplier ?? "1.00",
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
