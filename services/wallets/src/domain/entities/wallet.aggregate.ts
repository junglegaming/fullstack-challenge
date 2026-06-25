import {
  InsufficientFundsError,
  NonPositiveAmountError,
} from "../errors/wallet.errors";
import { Money } from "../value-objects/money.vo";
import { WalletTransaction } from "./wallet-transaction.entity";

export class Wallet {

  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    private balance: Money,
    public readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(params: {
    id: string;
    playerId: string;
    initialBalance: Money;
    now: Date;
  }): Wallet {
    if (params.initialBalance.isNegative()) {
      throw new InsufficientFundsError(0n, params.initialBalance.toCents());
    }
    return new Wallet(
      params.id,
      params.playerId,
      params.initialBalance,
      params.now,
      params.now,
    );
  }

  static rehydrate(params: {
    id: string;
    playerId: string;
    balance: Money;
    createdAt: Date;
    updatedAt: Date;
  }): Wallet {
    return new Wallet(
      params.id,
      params.playerId,
      params.balance,
      params.createdAt,
      params.updatedAt,
    );
  }

  getBalance(): Money {
    return this.balance;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  credit(
    amount: Money,
    reference: string,
    ids: { transactionId: string; now: Date },
  ): WalletTransaction {
    this.assertPositive(amount);
    this.balance = this.balance.add(amount);
    this.updatedAt = ids.now;
    return new WalletTransaction(
      ids.transactionId,
      this.id,
      "CREDIT",
      amount,
      reference,
      this.balance,
      ids.now,
    );
  }

  debit(
    amount: Money,
    reference: string,
    ids: { transactionId: string; now: Date },
  ): WalletTransaction {
    this.assertPositive(amount);

    if (this.balance.isLessThan(amount)) {
      throw new InsufficientFundsError(amount.toCents(), this.balance.toCents());
    }
    this.balance = this.balance.subtract(amount);
    this.updatedAt = ids.now;
    return new WalletTransaction(
      ids.transactionId,
      this.id,
      "DEBIT",
      amount,
      reference,
      this.balance,
      ids.now,
    );
  }

  private assertPositive(amount: Money): void {
    if (!amount.isPositive()) {
      throw new NonPositiveAmountError();
    }
  }
}
