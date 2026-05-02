export type BetStatus = 'ACTIVE' | 'CASHED_OUT' | 'LOST';

export class Bet {
  constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly amount: number, // centavos
    public status: BetStatus = 'ACTIVE',
    public cashoutMultiplier?: number,
  ) {}

  cashOut(multiplier: number) {
    if (this.status !== 'ACTIVE') {
      throw new Error('Bet already finished');
    }

    this.status = 'CASHED_OUT';
    this.cashoutMultiplier = multiplier;
  }

  lose() {
    this.status = 'LOST';
  }

  get payout(): number {
    if (!this.cashoutMultiplier) return 0;

    return Math.floor(this.amount * this.cashoutMultiplier);
  }
}