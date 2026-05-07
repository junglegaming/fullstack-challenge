import { GameRepository } from "../../infrastructure/repositories/game.repository";
import { RoundService } from "../service/round.service";
import { RabbitMQClient } from "../rabbitmq.client";
import { Injectable } from "@nestjs/common";
import { Bet } from "../../domain/entities/bet.entity";
import { GameEngine } from "../game.engine";
@Injectable()
export class PlaceBetUseCase {
  constructor(
    private readonly roundService: RoundService,
    private readonly gameRepository: GameRepository,
    private readonly rabbit: RabbitMQClient,
    private readonly engine: GameEngine, // ✅ Precisamos injetar o motor aqui
  ) {}

  async execute(playerId: string, amount: bigint) {
    const round = this.roundService.getCurrentRound();
    const bet = new Bet(playerId, amount, round.id);

    // 1. Validação de Domínio
    round.placeBet(bet);

    // 2. PERSISTÊNCIA (Postgres)
    await this.gameRepository.createBet(bet as any);

    // 3. REGISTRO NO MOTOR (Essencial para o Cashout funcionar!)
    // Isso alimenta o Map<string, bigint> dentro do GameEngine
    this.engine.placeBet(playerId, amount);

    // 4. EVENTO (RabbitMQ)
    await this.rabbit.emitBetPlaced(playerId, amount);

    return { 
      success: true, 
      roundId: round.id,
      betId: bet.id 
    };
  }
}