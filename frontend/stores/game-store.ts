import { create } from "zustand";

interface GameState {
  multiplier: number;
  status: "BETTING" | "RUNNING" | "CRASHED" | "FINISHED";
  crashPoint: number | null;
  balance: number;
  activeBets: Array<{
    betId: string;
    playerId: string;
    amountCents: number;
    status: string;
    cashoutMultiplier?: number;
  }>;
  setMultiplier: (m: number) => void;
  setStatus: (s: GameState["status"]) => void;
  setCrashPoint: (c: number | null) => void;
  setBalance: (b: number) => void;
  addBet: (bet: GameState["activeBets"][number]) => void;
  updateBet: (betId: string, update: Partial<GameState["activeBets"][number]>) => void;
  resetBets: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  multiplier: 1.0,
  status: "BETTING",
  crashPoint: null,
  balance: 0,
  activeBets: [],

  setMultiplier: (multiplier) => set({ multiplier }),
  setStatus: (status) => set({ status }),
  setCrashPoint: (crashPoint) => set({ crashPoint }),
  setBalance: (balance) => set({ balance }),
  addBet: (bet) =>
    set((state) => ({ activeBets: [...state.activeBets, bet] })),
  updateBet: (betId, update) =>
    set((state) => ({
      activeBets: state.activeBets.map((b) =>
        b.betId === betId ? { ...b, ...update } : b,
      ),
    })),
  resetBets: () => set({ activeBets: [] }),
}));
