import { create } from 'zustand'

type GameState = {
  multiplier: number
  crashed: boolean

  setMultiplier: (value: number) => void
  setCrashed: (value: boolean) => void
}

export const useGameStore = create<GameState>((set) => ({
  multiplier: 1,
  crashed: false,

  setMultiplier: (value) =>
    set({
      multiplier: value,
    }),

  setCrashed: (value) =>
    set({
      crashed: value,
    }),
}))

