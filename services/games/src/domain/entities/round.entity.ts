import { Bet } from "./bet.entity";

export enum RoundStatus {
  BETTING = 'BETTING',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED',
}

export class Round {
  constructor(
    public readonly id: string,
    public status: RoundStatus,
    public crashPoint: number,
    public currentMultiplier: number = 1.0,
    public bets: Bet[] = [],
  ) {}

  start() {
    if (this.status !== RoundStatus.BETTING) {
      throw new Error('Round must be in betting phase');
    }
    this.status = RoundStatus.RUNNING;
  }

  updateMultiplier(value: number) {
    this.currentMultiplier = value;
  }

  crash() {
    this.status = RoundStatus.CRASHED;

    // todas apostas ativas perdem
    this.bets.forEach(bet => {
      if (bet.status === 'ACTIVE') {
        bet.lose();
      }
    });
  }

  placeBet(bet: Bet) {
    if (this.status !== RoundStatus.BETTING) {
      throw new Error('Betting closed');
    }

    const alreadyBet = this.bets.find(b => b.playerId === bet.playerId);
    if (alreadyBet) {
      throw new Error('Only one bet per round');
    }

    this.bets.push(bet);
  }
}