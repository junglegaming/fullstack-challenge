import { BetStatus } from '../enum/bet-status.enum'

export class Bet {
  private _status = BetStatus.PENDING

  constructor(
    public readonly playerId: string,
    public readonly amount: bigint,
  ) {}

  get status() {
    return this._status
  }

  cashout() {
    if (this._status !== BetStatus.PENDING) {
      throw new Error('BET_ALREADY_RESOLVED')
    }

    this._status = BetStatus.CASHED_OUT
  }

  lose() {
    this._status = BetStatus.LOST
  }
}