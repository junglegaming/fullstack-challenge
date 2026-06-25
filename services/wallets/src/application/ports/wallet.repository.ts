import { Wallet } from "../../domain/entities/wallet.aggregate";
import { WalletTransaction } from "../../domain/entities/wallet-transaction.entity";

export const WALLET_REPOSITORY = Symbol("WALLET_REPOSITORY");

export interface WalletRepository {
  findById(id: string): Promise<Wallet | null>;
  findByPlayerId(playerId: string): Promise<Wallet | null>;
  create(wallet: Wallet): Promise<Wallet>;

  applyTransaction(
    wallet: Wallet,
    transaction: WalletTransaction,
  ): Promise<void>;

  findTransactionByReference(
    reference: string,
  ): Promise<WalletTransaction | null>;
}
