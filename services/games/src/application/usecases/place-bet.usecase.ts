import { Injectable } from "@nestjs/common";
import { GameEngine } from "../game.engine";
import { RabbitMQClient } from "../rabbitmq.client";
import { RoundService } from "../service/round.service";
import { Bet } from "../../domain/entities/bet.entity";

@Injectable()
export class PlaceBetUseCase {
  constructor(
    private readonly roundService: RoundService,
    private readonly rabbit: RabbitMQClient,
    private readonly engine: GameEngine, // 🆕 Injete o motor aqui
  ) {}

  async execute(playerId: string, amount: bigint) {
    const round = this.roundService.getCurrentRound();

    // 1. Registra no objeto da rodada (domínio)
    round.placeBet(new Bet(playerId, amount));

    // 2. 🆕 NOTIFICA O MOTOR (Fundamental para o cashout funcionar)
    this.engine.placeBet(playerId, amount);

    // 3. Avisa o serviço de Wallet via RabbitMQ
    await this.rabbit.emitBetPlaced(playerId, amount);

    return { success: true };
  }
}