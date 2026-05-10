

export class RoundStatistics {
  private constructor(
    readonly totalAmount: bigint,
  ) {}

  static create(totalAmount: bigint): RoundStatistics {
    if (totalAmount < 0n) {
      throw new Error("totalAmount não pode ser negativo");
    }
    return new RoundStatistics(totalAmount);
  }


  toJSON() {
    return {
      totalAmount: this.totalAmount.toString(),
    };
  }
}
