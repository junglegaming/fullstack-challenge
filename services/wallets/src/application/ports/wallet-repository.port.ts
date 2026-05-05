import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletId } from '../../domain/value-objects/wallet-id.vo';
import { PlayerId } from '../../domain/value-objects/player-id.vo';

export interface IWalletRepository {
  findById(walletId: WalletId): Promise<Wallet | null>;
  findByPlayerId(playerId: PlayerId): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
  existsByPlayerId(playerId: PlayerId): Promise<boolean>;
}
