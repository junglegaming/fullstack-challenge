import { Injectable } from "@nestjs/common"
import { Round } from "../../domain/entities/round.entity" // Importe o repository
import { GameRepository } from "../../infrastructure/repositories/game.repository"

@Injectable()
export class RoundService {
  private currentRound: Round | null = null

  constructor(private gameRepository: GameRepository) {} // Injetando o repository

  setCurrentRound(round: Round) {
    this.currentRound = round
    // Nota: A persistência agora é feita pelo GameEngine chamando o repository.createRound
  }

  getCurrentRound(): Round {
    if (!this.currentRound) {
      throw new Error('NO_ACTIVE_ROUND')
    }
    return this.currentRound
  }

  // AGORA ELE É REALMENTE ASSÍNCRONO E BUSCA NO BANCO
  async getRoundById(id: string): Promise<any> {
    // 1. Tenta buscar no banco de dados
    const roundFromDb = await this.gameRepository.findRoundById(id);
    
    if (roundFromDb) {
      return roundFromDb;
    }

    // 2. Fallback: Se por algum motivo não estiver no banco mas estiver na memória
    // (Opcional se você quiser manter o Map, mas o banco é a fonte da verdade)
    return undefined;
  }

  async getHistory() {
  // O Service atua como um "garçom": ele leva o pedido do controller até o repositório
  return await this.gameRepository.getRecentRounds();
}
}