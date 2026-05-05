import { TransactionId } from '../value-objects/transaction-id.vo';
import { WalletId } from '../value-objects/wallet-id.vo';
import { Money } from '../value-objects/money.vo';
import { TransactionType } from '../value-objects/transaction-type.vo';
import { TransactionStatus } from '../value-objects/transaction-status.vo';

export class Transaction {
  private constructor(
    private readonly _id: TransactionId,
    private readonly _walletId: WalletId,
    private readonly _type: TransactionType,
    private readonly _amount: Money,
    private readonly _balanceAfter: Money,
    private readonly _referenceId: string,
    private _status: TransactionStatus,
    private readonly _createdAt: Date,
  ) {}

  static create(
    id: TransactionId,
    walletId: WalletId,
    type: TransactionType,
    amount: Money,
    balanceAfter: Money,
    referenceId: string,
  ): Transaction {
    if (!referenceId || referenceId.trim().length === 0) {
      throw new Error('ReferenceId cannot be empty');
    }
    return new Transaction(
      id,
      walletId,
      type,
      amount,
      balanceAfter,
      referenceId,
      'CONFIRMED',
      new Date(),
    );
  }

  get id(): TransactionId {
    return this._id;
  }

  get walletId(): WalletId {
    return this._walletId;
  }

  get type(): TransactionType {
    return this._type;
  }

  get amount(): Money {
    return this._amount;
  }

  get balanceAfter(): Money {
    return this._balanceAfter;
  }

  get referenceId(): string {
    return this._referenceId;
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  markAsFailed(): void {
    if (this._status !== 'PENDING') {
      throw new Error('Can only mark PENDING transactions as FAILED');
    }
    this._status = 'FAILED';
  }

  reverse(): void {
    if (this._status !== 'CONFIRMED') {
      throw new Error('Can only reverse CONFIRMED transactions');
    }
    this._status = 'REVERSED';
  }
}
