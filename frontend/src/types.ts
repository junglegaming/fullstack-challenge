export type RoundPhase = 'BETTING' | 'RUNNING' | 'CRASHED'

export interface RoundBet {
  playerId: string
  amount: number
  cashedOut: boolean
  multiplier?: number
  payout?: number
}

export interface CurrentRound {
  roundId: string
  phase: RoundPhase
  hash: string
  bettingEndsAt?: string
  startedAt?: string
  multiplier?: number
  crashPoint?: number
  seed?: string
  bets: RoundBet[]
}

export interface CrashHistoryEntry {
  roundId: string
  crashPoint: number
}

export interface WalletInfo {
  availableBalance: number
  reservedBalance: number
}

// WebSocket event payloads
export interface RoundBettingPayload {
  roundId: string
  hash: string
  bettingEndsAt: string
}

export interface RoundStartedPayload {
  roundId: string
  startedAt: string
}

export interface MultiplierTickPayload {
  roundId: string
  multiplier: number
  elapsed: number
}

export interface RoundCrashedPayload {
  roundId: string
  crashPoint: number
  seed: string
  bets: RoundBet[]
}

export interface BetPlacedPayload {
  roundId: string
  playerId: string
  amount: number
}

export interface BetCashedOutPayload {
  roundId: string
  playerId: string
  multiplier: number
  payout: number
}

export interface WalletSettledPayload {
  playerId: string
  availableBalance: number
}
