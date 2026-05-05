import { RoundId } from '../value-objects/round-id.vo';
import { Multiplier } from '../value-objects/multiplier.vo';
import { RoundStatus } from '../enums/round-status.enum';
import { Bet } from './bet.entity';
import { PlayerId } from '../value-objects/player-id.vo';
import { BetId } from '../value-objects/bet-id.vo';
import { Money } from '../value-objects/money.vo';

export class Round {
  private bets: Bet[];
  private currentMultiplier: Multiplier;

  constructor(
    private readonly id: RoundId,
    private status: RoundStatus,
    private readonly crashPoint: Multiplier,
  ) {
    if (crashPoint.raw < 1.0) {
      throw new Error('Crash point must be greater than or equal to 1.0');
    }
    this.currentMultiplier = new Multiplier(1.0);
    this.bets = [];
  }

  get roundId(): RoundId {
    return this.id;
  }

  get roundStatus(): RoundStatus {
    return this.status;
  }

  get roundCrashPoint(): Multiplier {
    return this.crashPoint;
  }

  get multiplier(): Multiplier {
    return this.currentMultiplier;
  }

  get roundBets(): readonly Bet[] {
    return this.bets;
  }

  start(): void {
    if (this.status !== RoundStatus.BETTING) {
      throw new Error('Round must be in BETTING state to start');
    }
    this.status = RoundStatus.RUNNING;
  }

  updateMultiplier(multiplier: Multiplier): void {
    if (this.status !== RoundStatus.RUNNING) {
      throw new Error('Can only update multiplier while RUNNING');
    }
    if (multiplier.raw < this.currentMultiplier.raw) {
      throw new Error('Multiplier cannot decrease');
    }
    this.currentMultiplier = multiplier;
  }

  crash(): void {
    if (this.status !== RoundStatus.RUNNING) {
      throw new Error('Can only crash while RUNNING');
    }
    this.status = RoundStatus.CRASHED;

    for (const bet of this.bets) {
      bet.lose();
    }
  }

  finish(): void {
    if (this.status !== RoundStatus.CRASHED) {
      throw new Error('Can only finish after CRASHED');
    }
    this.status = RoundStatus.FINISHED;
  }

  placeBet(betId: BetId, playerId: PlayerId, amount: Money): Bet {
    if (this.status !== RoundStatus.BETTING) {
      throw new Error('Betting is only allowed during BETTING phase');
    }

    const existingBet = this.bets.find(b => b.player.equals(playerId));
    if (existingBet) {
      throw new Error('Player already has a bet in this round');
    }

    const bet = new Bet(betId, playerId, amount);
    this.bets.push(bet);
    return bet;
  }

  cashOut(playerId: PlayerId): Bet {
    if (this.status !== RoundStatus.RUNNING) {
      throw new Error('Cashout only allowed while RUNNING');
    }

    const bet = this.bets.find(b => b.player.equals(playerId));
    if (!bet) {
      throw new Error('No bet found for this player in the current round');
    }

    bet.cashOut(this.currentMultiplier);
    return bet;
  }

  hasBetFromPlayer(playerId: PlayerId): boolean {
    return this.bets.some(b => b.player.equals(playerId));
  }

  getActiveBets(): readonly Bet[] {
    return this.bets.filter(b => b.betStatus === 'ACTIVE');
  }
}
