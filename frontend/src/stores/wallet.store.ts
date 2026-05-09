import { create } from 'zustand'

type WalletState = {
  balance: number

  setBalance: (value: number) => void
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,

  setBalance: (value) =>
    set({
      balance: value,
    }),
}))