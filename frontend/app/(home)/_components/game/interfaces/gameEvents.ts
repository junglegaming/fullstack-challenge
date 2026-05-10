export interface GameEvents {
  betting_timer: { secondsLeft: number }
  multiplier_update: {
    multiplier: string
  }
  user_stats_update: {
        totalBets: string
  }
  game_crash: { crashPoint: string }
  round_started: { roundId: string; crashPoint: string }
  round_ended: { roundId: string; crashPoint: string }
}
