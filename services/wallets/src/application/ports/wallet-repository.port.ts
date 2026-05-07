import { Wallet } from '../../domain/entities/wallet.entity';
import { WalletId } from '../../domain/value-objects/wallet-id.vo';
import { PlayerId } from '../../domain/value-objects/player-id.vo';

export abstract class IWalletRepository {
  abstract findById(walletId: WalletId): Promise<Wallet | null>;
  abstract findByPlayerId(playerId: PlayerId): Promise<Wallet | null>;
  abstract save(wallet: Wallet): Promise<void>;
  abstract existsByPlayerId(playerId: PlayerId): Promise<boolean>;
}
