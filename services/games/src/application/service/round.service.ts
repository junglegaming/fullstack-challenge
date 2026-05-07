import { Round } from "../../domain/entities/round.entity"


export class RoundService {
  private currentRound: Round | null = null

  setCurrentRound(round: Round) {
    this.currentRound = round
  }

  getCurrentRound(): Round {
    if (!this.currentRound) {
      throw new Error('NO_ACTIVE_ROUND')
    }

    return this.currentRound
  }
}