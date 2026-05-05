import { Wallet } from '../../../src/domain/entities/wallet.entity';
import { WalletId } from '../../../src/domain/value-objects/wallet-id.vo';
import { PlayerId } from '../../../src/domain/value-objects/player-id.vo';
import { Money } from '../../../src/domain/value-objects/money.vo';
import { IWalletRepository } from '../../../src/application/ports/wallet-repository.port';

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
