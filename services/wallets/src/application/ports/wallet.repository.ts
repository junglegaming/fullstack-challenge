import { Wallet } from "../../domain/entities/wallet";
import { PlayerId } from "../../domain/value-objects/player-id";

export const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");

export interface WalletRepository {
  findByPlayerId(playerId: PlayerId): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
}
