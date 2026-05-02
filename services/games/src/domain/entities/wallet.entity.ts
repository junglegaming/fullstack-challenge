export class Wallet {
  constructor(
    public readonly playerId: string,
    public balance: number, // centavos
  ) {}

  debit(amount: number) {
    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }
    this.balance -= amount;
  }

  credit(amount: number) {
    this.balance += amount;
  }
}