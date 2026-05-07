import { BetStatus } from '../enum/bet-status.enum'

export class Bet {
  private _status = BetStatus.PENDING
  public readonly id: string;

  constructor(
    public readonly playerId: string,
    public readonly amount: bigint,
    public readonly roundId: string,
    id?: string,
  ) {
    this.id = id ?? crypto.randomUUID();
  }

  get status() {
    return this._status
  }

  cashout(multiplier: number) {
  if (this._status !== BetStatus.PENDING) {
    throw new Error('BET_ALREADY_RESOLVED')
  }

  this._status = BetStatus.CASHED_OUT

  return Number(this.amount) * multiplier
}

  lose() {
    this._status = BetStatus.LOST
  }
}