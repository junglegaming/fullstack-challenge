import { apiFetch } from "@/lib/api"
import {
  LeaderboardItem,
  RoundHistoryItem,
  Bet,
  CashoutResponse,
} from "../_types/Game"

export const gameService = {
  async getRoundHistory(): Promise<RoundHistoryItem[]> {
    const res = await apiFetch<{ data: RoundHistoryItem[] }>(
      "/games/rounds/history"
    )
    return res.data
  },

  async getLeaderboard(): Promise<LeaderboardItem[]> {
    const res = await apiFetch<{ data: LeaderboardItem[] }>(
      "/games/leaderboard"
    )
    return res.data
  },

  async createBet(
    token: string,
    data: { amount: string }
  ): Promise<{ message: string; data: Bet }> {
    return await apiFetch("/games/bet", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: data.amount,
      }),
    })
  },

  async betCashout(token: string, roundId: string): Promise<CashoutResponse> {
    return await apiFetch("/games/bet/cashout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roundId }),
    })
  },

  async verifyRound(roundId: string): Promise<{
    data: {
      id: string
      status: "BETTING" | "RUNNING" | "CRASHED"
      crashPoint: number
      startTime: string
      endTime: string
      serverSeed: string
      serverSeedHash: string
      clientSeed: string
      nonce: number
    }
  }> {
    return apiFetch(`/games/rounds/${roundId}/verify`)
  },
}
