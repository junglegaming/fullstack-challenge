export interface RoundHistoryItem {
  id: string
  crashPoint: number
  status: string
  startTime: string
  endTime: string | null
  serverSeedHash: string
  clientSeed: string
  nonce: number
}

export interface LeaderboardItem {
  name: string
  avatar: string
  amount: bigint
  payout: number
}

export interface Bet {
  id: string
  userId: string
  amount: bigint
  roundId: string
  multiplierAtCashout: number | null
  status: "PENDING" | "WON" | "LOST"
  createdAt: string
}

export interface Round {
  id: string
  status: "WAITING" | "RUNNING" | "FINISHED"
  currentMultiplier: number
  startTime?: string
  endTime?: string
}

export interface GameState {
  activeRound: Round | null
  userBets: Bet[]
}

export interface CashoutResponse {
  message: string
  result: string
}
