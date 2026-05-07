import { Injectable, Inject } from '@nestjs/common';
import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletId } from '../../domain/value-objects/wallet-id.vo';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { IWalletRepository } from '../ports/wallet-repository.port';
import { CreateWalletDto } from '../dtos/create-wallet.dto';

@Injectable()
export class CreateWalletUseCase {
  constructor(@Inject('IWalletRepository') private readonly walletRepository: IWalletRepository) {}

  async execute(dto: CreateWalletDto): Promise<{ walletId: string; playerId: string; balanceCents: bigint }> {
    const playerId = dto.playerId;

    // Check if wallet already exists for this player
    const existing = await this.walletRepository.findByPlayerId(playerId);
    if (existing) {
      throw new Error(`Wallet already exists for player ${playerId.raw}`);
    }

    const walletId = new WalletId(crypto.randomUUID());
    const wallet = new Wallet(
      walletId,
      playerId,
      dto.initialBalance,
    );

    await this.walletRepository.save(wallet);

    return {
      walletId: walletId.raw,
      playerId: playerId.raw,
      balanceCents: wallet.walletBalance.amount,
    };
  }
}
