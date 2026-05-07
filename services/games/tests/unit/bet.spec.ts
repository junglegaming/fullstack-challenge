import { describe, expect, it } from 'bun:test'

import { Bet } from '../../src/domain/entities/bet.entity'
import { BetStatus } from '../../src/domain/enum/bet-status.enum'

describe('Bet', () => {
  it('should cashout correctly', () => {
    const bet = new Bet('player-1', 1000n)

    bet.cashout()

    expect(bet.status).toBe(BetStatus.CASHED_OUT)
  })

  it('should not allow double cashout', () => {
    const bet = new Bet('player-1', 1000n)

    bet.cashout()

    expect(() => bet.cashout()).toThrow(
      'BET_ALREADY_RESOLVED',
    )
  })

  it('should mark bet as lost', () => {
    const bet = new Bet('player-1', 1000n)

    bet.lose()

    expect(bet.status).toBe(BetStatus.LOST)
  })
})