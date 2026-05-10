import { WalletProps } from "@/domain/repositories/wallet-repository.interface";
import { Money } from "@/domain/value-objects/Money";

export class Wallet {
  private props: WalletProps;

  constructor(props: WalletProps) {
    this.props = props;
  }

  get userId(): string {
    return this.props.userId;
  }

  get balance(): Money {
    return this.props.balance;
  }

  deposit(amount: Money): void {
    this.props.balance = this.props.balance.add(amount);
    this.props.updatedAt = new Date();
  }

  withdraw(amount: Money): void {
    this.props.balance = this.props.balance.subtract(amount);
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      ...this.props,
      balance: this.props.balance.cents,
    };
  }
}
