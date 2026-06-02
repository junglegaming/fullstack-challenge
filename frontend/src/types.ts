export type RoundPhase = 'BETTING' | 'RUNNING' | 'CRASHED'

export type BetStatus = 'PENDING' | 'CASHED_OUT' | 'LOST'

export interface RoundBet {
  playerId: string
  amountCents: number
  status: BetStatus
  payoutCents: number | null
  multiplier?: number
}

export interface CurrentRound {
  roundId: string
  state: RoundPhase
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
  /** Set only for rounds where the current player had a bet */
  playerResult?: { cashedOut: true; multiplier: number } | { cashedOut: false }
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
  elapsedMs: number
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
  amountCents: number
}

export interface BetCashedOutPayload {
  roundId: string
  playerId: string
  multiplier: number
  payoutCents: number
}

export interface WalletSettledPayload {
  playerId: string
  availableBalanceCents: number
}
