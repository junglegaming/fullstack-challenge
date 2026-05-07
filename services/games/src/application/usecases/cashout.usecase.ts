import { Injectable, BadRequestException } from '@nestjs/common';
import { GameEngine } from '../game.engine'; 
import { RabbitMQClient } from '../rabbitmq.client';

@Injectable()
export class CashoutUseCase {
  constructor(
    private readonly gameEngine: GameEngine,
    private readonly rabbit: RabbitMQClient,
) {}

  async execute(playerId: string) {
    try {
      // Repassa a ação para a Engine do jogo, que sabe qual é o multiplicador atual
      const result = await this.gameEngine.cashout(playerId);

      await this.rabbit.emitCashout(playerId, result.profit)
      
      return {
      success: true,
      message: 'Cashout realizado com sucesso',
      // Aqui você monta o objeto de resposta sem o BigInt bruto
      data: {
        playerId: result.playerId,
        paidMultiplier: result.paidMultiplier,
        profit: result.profit.toString(), // 🔍 Converte aqui dentro também!
      }
    };
    } catch (error: any) {
      // Se o jogador tentar dar cashout num jogo que já crashou, a engine deve lançar um erro
      throw new BadRequestException(error.message || 'Não foi possível realizar o cashout');
    }
  }
}