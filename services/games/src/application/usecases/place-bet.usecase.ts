import { GameRepository } from "../../infrastructure/repositories/game.repository";
import { RoundService } from "../service/round.service";
import { RabbitMQClient } from "../rabbitmq.client";
import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Bet } from "../../domain/entities/bet.entity";
import { GameEngine } from "../game.engine";

@Injectable()
export class PlaceBetUseCase {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly engine: GameEngine,
    private readonly rabbit: RabbitMQClient,
    private readonly roundService: RoundService,
  ) {}


async execute(playerId: string, amount: bigint, token: string) {
 
  try {
    const response = await fetch('http://127.0.0.1:4002/wallets/me', {
  method: 'GET',    
  headers: {
    'Authorization': token,
    'Content-Type': 'application/json',
  },
  });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new UnauthorizedException('Sessão expirada ou inválida');
      }
      throw new Error('Falha na comunicação com o serviço de carteira');
    }

    const walletData = await response.json();
    
    const currentBalance = BigInt(walletData.balance);

    if (currentBalance < amount) {
      throw new BadRequestException('Saldo insuficiente para realizar esta aposta');
    }

  } catch (error: any) {
    if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
      throw error;
    }
    throw new BadRequestException(`Erro ao validar saldo: ${error.message}`);
  }

 
  const round = this.roundService.getCurrentRound();
  
  if (round.status !== 'BETTING') {
    throw new BadRequestException('A rodada já começou. Aguarde a próxima!');
  }

 const bet = new Bet(playerId, amount, round.id);

  console.log(`🕹️ Adicionando player ${playerId} na Engine para a rodada ${round.id}`);
  this.engine.placeBet(playerId, amount); 

  await this.gameRepository.createBet({
    id: bet.id,
    playerId: bet.playerId,
    roundId: bet.roundId,
    amount: bet.amount,
    status: 'PENDING',
  } as any);

  await this.rabbit.emitBetPlaced(playerId, amount);

  return { 
    success: true, 
    betId: bet.id,
    message: 'Aposta confirmada e registrada na engine!' 
  };
}
}
