import { create } from "zustand";
import type { BetSummary, CurrentRound, RoundHistoryItem } from "../services/api";
import type { MultiplierGrowthConfig } from "../utils/multiplier-growth";
import { createFallbackMultiplierGrowthConfig } from "../utils/multiplier-config";

export type MultiplierTickSnapshot = {
  multiplier: string;
  at: number;
};

type GameState = {
  connected: boolean;
  visualMultiplier: string;
  latestMultiplierTick: MultiplierTickSnapshot | null;
  multiplierGrowthConfig: MultiplierGrowthConfig;
  serverTimeOffsetMs: number;
  currentRound: CurrentRound | null;
  roundBets: BetSummary[];
  history: RoundHistoryItem[];
  setConnected: (connected: boolean) => void;
  setVisualMultiplier: (multiplier: string) => void;
  applyMultiplierTick: (multiplier: string, occurredAt: string) => void;
  resetMultiplierTicks: () => void;
  setMultiplierSync: (input: {
    multiplierGrowthConfig: MultiplierGrowthConfig;
    serverTimeOffsetMs: number;
  }) => void;
  setCurrentRound: (round: CurrentRound | null) => void;
  setRoundBets: (bets: BetSummary[]) => void;
  upsertBet: (bet: BetSummary) => void;
  setHistory: (items: RoundHistoryItem[]) => void;
};

export const useGameStore = create<GameState>((set) => ({
  connected: false,
  visualMultiplier: "1.00",
  latestMultiplierTick: null,
  multiplierGrowthConfig: createFallbackMultiplierGrowthConfig(),
  serverTimeOffsetMs: 0,
  currentRound: null,
  roundBets: [],
  history: [],
  setConnected: (connected) => set({ connected }),
  setVisualMultiplier: (visualMultiplier) => set({ visualMultiplier }),
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
  setMultiplierSync: ({ multiplierGrowthConfig, serverTimeOffsetMs }) =>
    set({ multiplierGrowthConfig, serverTimeOffsetMs }),
  setCurrentRound: (currentRound) =>
    set((state) => {
      const isRunning = currentRound?.status === "RUNNING";

      return {
        currentRound,
        roundBets: currentRound?.bets ?? [],
        latestMultiplierTick: isRunning ? state.latestMultiplierTick : null,
        visualMultiplier: isRunning
          ? state.visualMultiplier
          : (currentRound?.currentMultiplier ?? "1.00"),
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
