import { randomUUID } from "node:crypto";
import { InvalidMoneyAmountError } from "../errors/invalid-money-amount.error";
import { Money } from "../value-objects/money";
import { WalletId } from "../value-objects/wallet-id";
import { WalletTransactionType } from "../value-objects/wallet-transaction-type";

type WalletTransactionProps = {
  id: string;
  walletId: WalletId;
  type: WalletTransactionType;
  amount: Money;
  balanceAfter: Money;
  idempotencyKey: string;
};

export class WalletTransaction {
  private constructor(private readonly props: WalletTransactionProps) {}

  static create(input: {
    walletId: WalletId;
    type: WalletTransactionType;
    amount: Money;
    balanceAfter: Money;
    idempotencyKey: string;
  }): WalletTransaction {
    if (input.amount.amountInCents <= 0n) {
      throw new InvalidMoneyAmountError(
        "Transaction amount must be greater than zero",
      );
    }

    if (input.idempotencyKey.trim().length === 0) {
      throw new Error("Idempotency key cannot be empty");
    }

    return new WalletTransaction({
      id: randomUUID(),
      walletId: input.walletId,
      type: input.type,
      amount: input.amount,
      balanceAfter: input.balanceAfter,
      idempotencyKey: input.idempotencyKey.trim(),
    });
  }

  static reconstitute(props: WalletTransactionProps): WalletTransaction {
    return new WalletTransaction(props);
  }

  get id(): string {
    return this.props.id;
  }

  get walletId(): WalletId {
    return this.props.walletId;
  }

  get type(): WalletTransactionType {
    return this.props.type;
  }

  get amount(): Money {
    return this.props.amount;
  }

  get balanceAfter(): Money {
    return this.props.balanceAfter;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }
}
