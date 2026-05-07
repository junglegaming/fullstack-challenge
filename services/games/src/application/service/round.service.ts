import { Injectable } from "@nestjs/common"
import { Round } from "../../domain/entities/round.entity"

@Injectable()
export class RoundService {
  private currentRound: Round | null = null
  // Criamos um "banco de dados" em memória para o histórico
  private readonly roundsHistory = new Map<string, Round>();

  setCurrentRound(round: Round) {
    this.currentRound = round
    // Salva no histórico assim que a rodada é criada
    this.roundsHistory.set(round.id, round);
  }

  getCurrentRound(): Round {
    if (!this.currentRound) {
      throw new Error('NO_ACTIVE_ROUND')
    }
    return this.currentRound
  }

  // MÉTODO QUE O CONTROLLER VAI USAR:
  async getRoundById(id: string): Promise<Round | undefined> {
    return this.roundsHistory.get(id);
  }
}