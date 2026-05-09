import { Injectable, BadRequestException } from '@nestjs/common';
import { GameEngine } from '../game.engine'; 
import { RabbitMQClient } from '../rabbitmq.client';
import { GameRepository } from '../../infrastructure/repositories/game.repository';
import { RoundService } from '../service/round.service';

@Injectable()
export class CashoutUseCase {
  constructor(
    private readonly gameEngine: GameEngine,
    private readonly rabbit: RabbitMQClient,
    private readonly gameRepository: GameRepository,
    private readonly roundService: RoundService,
) {}

  async execute(playerId: string) {
    try {
      const result = await this.gameEngine.cashout(playerId);

      const round = this.roundService.getCurrentRound();

      await this.gameRepository.updateBetToWon(
        playerId, 
        round.id,
        result.profit, 
        result.paidMultiplier
      );

      await this.rabbit.emitCashout(playerId, result.profit)
      
      return {
      success: true,
      message: 'Cashout realizado com sucesso',
      data: {
        playerId: result.playerId,
        paidMultiplier: result.paidMultiplier,
        profit: result.profit.toString(),
      }
    };
    } catch (error: any) {
      throw new BadRequestException(error.message || 'Não foi possível realizar o cashout');
    }
  }
}