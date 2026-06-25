import { Money } from "../value-objects/money.vo";

export type TransactionType = "CREDIT" | "DEBIT";

export class WalletTransaction {
  constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly type: TransactionType,

    public readonly amount: Money,

    public readonly reference: string,

    public readonly balanceAfter: Money,
    public readonly createdAt: Date,
  ) {}
}
