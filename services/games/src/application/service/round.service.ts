import { Injectable } from "@nestjs/common"
import { Round } from "../../domain/entities/round.entity"

@Injectable()
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