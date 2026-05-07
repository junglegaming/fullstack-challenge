import { WalletId } from '../value-objects/wallet-id.vo';
import { PlayerId } from '../value-objects/player-id.vo';
import { Money } from '../value-objects/money.vo';
import { Transaction } from './transaction.entity';
import { TransactionId } from '../value-objects/transaction-id.vo';
import { TransactionType } from '../value-objects/transaction-type.vo';

export class Wallet {
  private transactions: Transaction[] = [];
  private confirmedByReference: Map<string, Transaction> = new Map();

  constructor(
    private readonly id: WalletId,
    private readonly playerId: PlayerId,
    private balance: Money,
  ) {
    if (balance.amount < 0n) throw new Error('Initial balance cannot be negative');
  }

  get walletId(): WalletId {
    return this.id;
  }

  get walletPlayerId(): PlayerId {
    return this.playerId;
  }

  get walletBalance(): Money {
    return this.balance;
  }

  get walletTransactions(): readonly Transaction[] {
    return this.transactions;
  }

  debit(amount: Money, referenceId: string): Transaction {
    if (amount.amount <= 0n) throw new Error('Debit amount must be positive');

    // Idempotency: return existing confirmed transaction
    const existing = this.confirmedByReference.get(referenceId);
    if (existing) return existing;

    // Check for PENDING with same referenceId (avoid duplicates)
    const pending = this.transactions.find(
      t => t.referenceId === referenceId && t.status === 'PENDING'
    );
    if (pending) {
      throw new Error(`Transaction with referenceId ${referenceId} is already pending`);
    }

    // Check sufficient balance
    if (this.balance.amount < amount.amount) {
      throw new Error('Insufficient funds');
    }

    this.balance = this.balance.subtract(amount);
    const transaction = Transaction.create(
      new TransactionId(crypto.randomUUID()),
      this.id,
      'DEBIT',
      amount,
      this.balance,
      referenceId,
    );

    this.transactions.push(transaction);
    this.confirmedByReference.set(referenceId, transaction);
    return transaction;
  }

  credit(amount: Money, referenceId: string): Transaction {
    if (amount.amount <= 0n) throw new Error('Credit amount must be positive');

    // Idempotency: return existing confirmed transaction
    const existing = this.confirmedByReference.get(referenceId);
    if (existing) return existing;

    const pending = this.transactions.find(
      t => t.referenceId === referenceId && t.status === 'PENDING'
    );
    if (pending) {
      throw new Error(`Transaction with referenceId ${referenceId} is already pending`);
    }

    this.balance = this.balance.add(amount);
    const transaction = Transaction.create(
      new TransactionId(crypto.randomUUID()),
      this.id,
      'CREDIT',
      amount,
      this.balance,
      referenceId,
    );

    this.transactions.push(transaction);
    this.confirmedByReference.set(referenceId, transaction);
    return transaction;
  }

  withdraw(amount: Money, referenceId: string): Transaction {
    return this.debit(amount, referenceId);
  }

  deposit(amount: Money, referenceId: string): Transaction {
    return this.credit(amount, referenceId);
  }
}
