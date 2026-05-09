import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { WalletRepository } from '../domain/wallet.repository';
import { BetPlacedEvent, CashoutEvent } from '../../../../packages/events/game.events';

@Controller()
export class WalletConsumer {
  private readonly logger = new Logger(WalletConsumer.name);

  constructor(
    @Inject('WalletRepository') 
    private readonly repo: WalletRepository
  ) {}

  @EventPattern('bet_placed')
  async handleBetPlaced(@Payload() data: BetPlacedEvent) {

    try {
      const wallet = await this.repo.findByPlayerId(data.playerId);
      
      if (!wallet) {
        this.logger.error(`Carteira não encontrada para o jogador ${data.playerId}`);
        return;
      }

      wallet.debit(BigInt(data.amount));
      await this.repo.save(wallet);
      
    } catch (error) {
    }
  }

  @EventPattern('cashout_done')
  async handleCashout(@Payload() data: CashoutEvent) {

    try {
      const wallet = await this.repo.findByPlayerId(data.playerId);

      if (!wallet) {
        this.logger.error(`Carteira não encontrada para o jogador ${data.playerId}`);
        return;
      }

      wallet.credit(BigInt(data.amount));
      await this.repo.save(wallet);

    } catch (error) {
    }
  }
}