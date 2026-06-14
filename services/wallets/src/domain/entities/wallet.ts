import { InvalidMoneyAmountError } from "../errors/invalid-money-amount.error";
import { Money } from "../value-objects/money";
import { PlayerId } from "../value-objects/player-id";
import { WalletId } from "../value-objects/wallet-id";

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
