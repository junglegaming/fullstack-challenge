import { Injectable } from '@nestjs/common';
import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletId } from '../../domain/value-objects/wallet-id.vo';
import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { IWalletRepository } from '../../application/ports/wallet-repository.port';

@Injectable()
export class MockWalletRepository implements IWalletRepository {
  private wallets: Map<string, Wallet> = new Map(); // keyed by walletId.raw
  private walletsByPlayer: Map<string, Wallet> = new Map(); // keyed by playerId.raw

  async findById(walletId: WalletId): Promise<Wallet | null> {
    return this.wallets.get(walletId.raw) || null;
  }

  async findByPlayerId(playerId: PlayerId): Promise<Wallet | null> {
    return this.walletsByPlayer.get(playerId.raw) || null;
  }

  async save(wallet: Wallet): Promise<void> {
    this.wallets.set(wallet.walletId.raw, wallet);
    this.walletsByPlayer.set(wallet.walletPlayerId.raw, wallet);
  }

  async existsByPlayerId(playerId: PlayerId): Promise<boolean> {
    return this.walletsByPlayer.has(playerId.raw);
  }
}
