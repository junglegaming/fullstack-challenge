import { InsufficientBalanceError } from "../errors/insufficient-balance.error";
import { InvalidMoneyAmountError } from "../errors/invalid-money-amount.error";
import { Money } from "../value-objects/money";
import { PlayerId } from "../value-objects/player-id";
import { WalletId } from "../value-objects/wallet-id";
import { WalletTransaction } from "./wallet-transaction";
import { WalletTransactionType } from "../value-objects/wallet-transaction-type";

type WalletMutationResult = {
  wallet: Wallet;
  transaction: WalletTransaction;
};

type WalletProps = {
  id: WalletId;
  playerId: PlayerId;
  balance: Money;
};

export class Wallet {
  private constructor(private readonly props: WalletProps) {}

  static create(input: { playerId: PlayerId; initialBalance: Money }): Wallet {
    if (input.initialBalance.amountInCents < 0n) {
      throw new InvalidMoneyAmountError("Initial balance cannot be negative");
    }

    return new Wallet({
      id: WalletId.generate(),
      playerId: input.playerId,
      balance: input.initialBalance,
    });
  }

  static reconstitute(input: {
    id: WalletId;
    playerId: PlayerId;
    balance: Money;
  }): Wallet {
    if (input.balance.amountInCents < 0n) {
      throw new InvalidMoneyAmountError("Stored balance cannot be negative");
    }

    return new Wallet(input);
  }

  credit(amount: Money, idempotencyKey: string): WalletMutationResult {
    if (amount.amountInCents <= 0n) {
      throw new InvalidMoneyAmountError("Credit amount must be greater than zero");
    }

    const balanceAfter = this.balance.add(amount);

    return {
      wallet: Wallet.reconstitute({
        id: this.id,
        playerId: this.playerId,
        balance: balanceAfter,
      }),
      transaction: WalletTransaction.create({
        walletId: this.id,
        type: WalletTransactionType.CREDIT,
        amount,
        balanceAfter,
        idempotencyKey,
      }),
    };
  }

  debit(amount: Money, idempotencyKey: string): WalletMutationResult {
    if (amount.amountInCents <= 0n) {
      throw new InvalidMoneyAmountError("Debit amount must be greater than zero");
    }

    if (!this.balance.isGreaterThanOrEqual(amount)) {
      throw new InsufficientBalanceError();
    }

    const balanceAfter = this.balance.subtract(amount);

    return {
      wallet: Wallet.reconstitute({
        id: this.id,
        playerId: this.playerId,
        balance: balanceAfter,
      }),
      transaction: WalletTransaction.create({
        walletId: this.id,
        type: WalletTransactionType.DEBIT,
        amount,
        balanceAfter,
        idempotencyKey,
      }),
    };
  }

  get id(): WalletId {
    return this.props.id;
  }

  get playerId(): PlayerId {
    return this.props.playerId;
  }

  get balance(): Money {
    return this.props.balance;
  }
}
