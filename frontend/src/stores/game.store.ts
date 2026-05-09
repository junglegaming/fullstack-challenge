import { create } from 'zustand'

type GameStatus =
  | 'betting'
  | 'running'
  | 'crashed'

type GameState = {
  multiplier: number
  crashed: boolean
  status: GameStatus
  hasBet: boolean // 💡 Novo estado global de aposta

  setMultiplier: (value: number) => void
  setCrashed: (value: boolean) => void
  setStatus: (status: GameStatus) => void
  setHasBet: (value: boolean) => void // 💡 Nova função para alterar
}

export const useGameStore = create<GameState>((set) => ({
  multiplier: 1,
  crashed: false,
  status: 'betting',
  hasBet: false, // 💡 Começa como false

  setMultiplier: (value) =>
    set({
      multiplier: value,
    }),

  setCrashed: (value) =>
    set({
      crashed: value,
    }),

  setStatus: (status) =>
    set({
      status,
    }),

  setHasBet: (value) => // 💡 Atualiza o estado global de aposta
    set({
      hasBet: value,
    }),
}))