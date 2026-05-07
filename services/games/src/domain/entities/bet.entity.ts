import { BetId } from '../value-objects/bet-id.vo';
import { PlayerId } from '../value-objects/player-id.vo';
import { Money } from '../value-objects/money.vo';
import { Multiplier } from '../value-objects/multiplier.vo';
import { BetStatus } from '../enums/bet-status.enum';

export class Bet {
  private status: BetStatus;
  private cashoutMultiplier: Multiplier | null;

  constructor(
    private readonly id: BetId,
    private readonly playerId: PlayerId,
    private readonly amount: Money,
  ) {
    this.status = BetStatus.ACTIVE;
    this.cashoutMultiplier = null;
  }

  get betId(): BetId {
    return this.id;
  }

  get player(): PlayerId {
    return this.playerId;
  }

  get betAmount(): Money {
    return this.amount;
  }

  get betStatus(): BetStatus {
    return this.status;
  }

  get cashoutMultiplierValue(): Multiplier | null {
    return this.cashoutMultiplier;
  }

  cashOut(multiplier: Multiplier): void {
    if (this.status !== BetStatus.ACTIVE) {
      throw new Error('Bet is already finished');
    }
    this.status = BetStatus.CASHED_OUT;
    this.cashoutMultiplier = multiplier;
  }

  lose(): void {
    if (this.status !== BetStatus.ACTIVE) return;
    this.status = BetStatus.LOST;
  }

  get payout(): Money {
    if (this.status !== BetStatus.CASHED_OUT || !this.cashoutMultiplier) {
      return Money.zero();
    }
    return this.amount.multiply(this.cashoutMultiplier.toDecimalString());
  }
}
