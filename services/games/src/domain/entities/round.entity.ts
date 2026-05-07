import { RoundStatus } from '../enum/round-status.enum'
import { Bet } from './bet.entity'

export class Round {
  private _status = RoundStatus.BETTING
  private _bets: Bet[] = []

  constructor(
    public readonly id: string,
    public readonly crashPoint: number,
  ) {}

  get status() {
    return this._status
  }

  get bets() {
    return this._bets
  }

  placeBet(bet: Bet) {
    if (this._status !== RoundStatus.BETTING) {
      throw new Error('BETTING_CLOSED')
    }

    const alreadyBet = this._bets.find(
      b => b.playerId === bet.playerId,
    )

    if (alreadyBet) {
      throw new Error('PLAYER_ALREADY_BET')
    }

    this._bets.push(bet)
  }

  start() {
    if (this._status !== RoundStatus.BETTING) {
      throw new Error('ROUND_ALREADY_STARTED')
    }

    this._status = RoundStatus.RUNNING
  }

  crash() {
    if (this._status !== RoundStatus.RUNNING) {
      throw new Error('ROUND_NOT_RUNNING')
    }

    this._status = RoundStatus.CRASHED

    this._bets.forEach(bet => {
      if (bet.status === 'PENDING') {
        bet.lose()
      }
    })
  }

  cashout(playerId: string, multiplier: number) {
  const bet = this._bets.find(
    bet => bet.playerId === playerId,
  )

  if (!bet) {
    throw new Error('BET_NOT_FOUND')
  }

  return bet.cashout(multiplier)
  }
}