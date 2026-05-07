import { create } from "zustand";
import { fetchWallet } from "@/services/wallet";

// Types
export interface Round {
  id: string;
  crashPoint: number;
  startedAt: number;
}

export interface Bet {
  betId: string;
  playerId: string;
  amountCents: number;
  status: "PENDING" | "CASHED_OUT" | "LOST";
  cashoutMultiplier?: number;
}

export interface UserBet extends Bet {
  payoutCents?: number;
}

// Phase type
type Phase = "BETTING" | "RUNNING" | "CRASHED";

// Store state
interface GameState {
  // State
  currentRound: Round | null;
  multiplier: number;
  phase: Phase;
  bets: Bet[];
  userBet: UserBet | null;
  balance: number; // in cents
  roundHistory: number[]; // last rounds' crash points, newest first

  // Actions
  setRound: (round: Round | null) => void;
  updateMultiplier: (multiplier: number) => void;
  setPhase: (phase: Phase) => void;
  addBet: (bet: Bet) => void;
  cashoutBet: (betId: string, multiplier: number) => void;
  setBalance: (balance: number) => void;
  fetchBalance: () => Promise<void>;
  resetForNewRound: () => void;
  addRoundToHistory: (crashPoint: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  // Initial state
  currentRound: null,
  multiplier: 1.0,
  phase: "BETTING",
  bets: [],
  userBet: null,
  balance: 0,
  roundHistory: [],

  // Actions
  setRound: (currentRound) => set({ currentRound }),

  updateMultiplier: (multiplier) => set({ multiplier }),

  setPhase: (phase) => set({ phase }),

  addBet: (bet) =>
    set((state) => ({
      bets: [...state.bets, bet],
      // Track if this is the user's bet
      userBet: bet.playerId === "player" ? { ...bet } as UserBet : state.userBet,
    })),

  cashoutBet: (betId, multiplier) =>
    set((state) => ({
      bets: state.bets.map((b) =>
        b.betId === betId
          ? { ...b, status: "CASHED_OUT" as const, cashoutMultiplier: multiplier }
          : b,
      ),
      userBet:
        state.userBet?.betId === betId
          ? {
              ...state.userBet,
              status: "CASHED_OUT" as const,
              cashoutMultiplier: multiplier,
              payoutCents: Math.round(
                state.userBet.amountCents * multiplier,
              ),
            }
          : state.userBet,
      // Update balance optimistically
      balance:
        state.userBet?.betId === betId
          ? state.balance +
            Math.round(state.userBet.amountCents * multiplier)
          : state.balance,
    })),

  setBalance: (balance) => set({ balance }),

  fetchBalance: async () => {
    try {
      const wallet = await fetchWallet();
      set({ balance: wallet.balanceCents });
    } catch (e) {
      console.error("Failed to fetch balance:", e);
    }
  },

  resetForNewRound: () =>
    set((state) => ({
      multiplier: 1.0,
      phase: "BETTING",
      bets: [],
      userBet: null,
      currentRound: null,
    })),

  addRoundToHistory: (crashPoint) =>
    set((state) => {
      const newHistory = [crashPoint, ...state.roundHistory];
      return { roundHistory: newHistory.slice(0, 10) };
    }),
}));
