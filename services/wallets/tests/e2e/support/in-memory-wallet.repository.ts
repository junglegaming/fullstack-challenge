import { Wallet } from "../../../src/domain/entities/wallet.aggregate";
import { WalletTransaction } from "../../../src/domain/entities/wallet-transaction.entity";
import type { WalletRepository } from "../../../src/application/ports/wallet.repository";
import { Money } from "../../../src/domain/value-objects/money.vo";

export class InMemoryWalletRepository implements WalletRepository {
  private readonly wallets = new Map<string, Wallet>();
  private readonly byPlayer = new Map<string, string>();
  private readonly transactions = new Map<string, WalletTransaction>();
  private readonly byReference = new Map<string, WalletTransaction>();

  async findById(id: string): Promise<Wallet | null> {
    return this.wallets.get(id) ?? null;
  }

  async findByPlayerId(playerId: string): Promise<Wallet | null> {
    const id = this.byPlayer.get(playerId);
    return id ? (this.wallets.get(id) ?? null) : null;
  }

  async create(wallet: Wallet): Promise<Wallet> {
    this.wallets.set(wallet.id, this.clone(wallet));
    this.byPlayer.set(wallet.playerId, wallet.id);
    return this.clone(wallet);
  }

  async applyTransaction(
    wallet: Wallet,
    transaction: WalletTransaction,
  ): Promise<void> {
    if (this.byReference.has(transaction.reference)) {
      throw new Error("duplicate reference");
    }
    this.wallets.set(wallet.id, this.clone(wallet));
    this.transactions.set(transaction.id, transaction);
    this.byReference.set(transaction.reference, transaction);
  }

  async findTransactionByReference(
    reference: string,
  ): Promise<WalletTransaction | null> {
    return this.byReference.get(reference) ?? null;
  }

  private clone(wallet: Wallet): Wallet {
    return Wallet.rehydrate({
      id: wallet.id,
      playerId: wallet.playerId,
      balance: Money.fromCents(wallet.getBalance().toCents()),
      createdAt: wallet.createdAt,
      updatedAt: wallet.getUpdatedAt(),
    });
  }
}
