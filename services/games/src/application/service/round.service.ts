import { Injectable } from "@nestjs/common"
import { Round } from "../../domain/entities/round.entity"
import { GameRepository } from "../../infrastructure/repositories/game.repository"

@Injectable()
export class RoundService {
  private currentRound: Round | null = null

  constructor(private gameRepository: GameRepository) {} 

  setCurrentRound(round: Round) {
    this.currentRound = round
  }

  getCurrentRound(): Round {
    if (!this.currentRound) {
      throw new Error('NO_ACTIVE_ROUND')
    }
    return this.currentRound
  }

  async getRoundById(id: string): Promise<any> {

    const roundFromDb = await this.gameRepository.findRoundById(id);
    
    if (roundFromDb) {
      return roundFromDb;
    }

    return undefined;
  }

  async getHistory() {
  return await this.gameRepository.getRecentRounds();
}
}