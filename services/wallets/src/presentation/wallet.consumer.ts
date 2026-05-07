import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
 // Ajuste o caminho
import type { WalletRepository } from '../domain/wallet.repository';
import { BetPlacedEvent, CashoutEvent } from '../../../../packages/events/game.events';

@Controller()
export class WalletConsumer {
  private readonly logger = new Logger(WalletConsumer.name);

  constructor( @Inject('WalletRepository') private readonly repo: WalletRepository) {} // Certifique-se que o Repo está injetado 

  @EventPattern('bet_placed')
  async handleBetPlaced(@Payload() data: BetPlacedEvent) {
    this.logger.log(`Recebendo aposta de ${data.amount} do jogador ${data.playerId}`);

    try {
      const wallet = await this.repo.findByPlayerId(data.playerId);
      
      if (!wallet) {
        this.logger.error(`Carteira não encontrada para o jogador ${data.playerId}`);
        return;
      }

      // A mágica acontece aqui: Débito usando BigInt   
      wallet.debit(BigInt(data.amount));

      await this.repo.save(wallet);
      
      this.logger.log(`Débito realizado com sucesso para o jogador ${data.playerId}`);
    } catch (error) {
      this.logger.error(`Erro ao processar aposta`);
      // Em um cenário real, aqui você dispararia um evento de compensação (Saga)
    }
  }

  @EventPattern('cashout_done') // O nome do evento deve ser o mesmo que o Game Service emitir
async handleCashout(@Payload() data: CashoutEvent) {
    this.logger.log(`Processando prêmio de ${data.amount} para o jogador ${data.playerId}`);

    try {
        const wallet = await this.repo.findByPlayerId(data.playerId);
        
        if (!wallet) {
        this.logger.error(`Carteira não encontrada para crédito: ${data.playerId}`);
        return;
        }

    // A mágica do BigInt novamente: Crédito sem perda de precisão
    wallet.credit(BigInt(data.amount));

    await this.repo.save(wallet);
    
    this.logger.log(`Crédito de ${data.amount} realizado com sucesso!`);
  } catch (error) {
    this.logger.error(`Erro ao processar crédito de cashout`);
  }
}
}