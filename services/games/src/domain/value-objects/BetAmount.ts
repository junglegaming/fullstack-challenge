export class BetAmount {
  private readonly amountInCents: bigint;

  private constructor(amountInCents: bigint) {
    const minAmount = BigInt(100);
    const maxAmount = BigInt(100000);

    if (amountInCents < minAmount || amountInCents > maxAmount) {
      throw new Error(
        `A aposta deve estar entre 1.00 e 1000.00 (Centavos: ${amountInCents})`,
      );
    }

    this.amountInCents = amountInCents;
  }

  static fromCents(cents: bigint): BetAmount {
    return new BetAmount(cents);
  }

  get cents(): bigint {
    return this.amountInCents;
  }
}
