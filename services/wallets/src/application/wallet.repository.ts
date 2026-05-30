import { Wallet } from "@/domain/wallet";

export const WALLET_REPOSITORY = Symbol("WalletRepository");

export interface WalletRepository {
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  save(wallet: Wallet): Promise<void>;
}
