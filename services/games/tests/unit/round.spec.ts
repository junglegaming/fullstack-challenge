import { Round } from '../../src/domain/entities/round.entity'
import { Bet } from '../../src/domain/entities/bet.entity'
import { RoundStatus } from '../../src/domain/enum/round-status.enum'
import { BetStatus } from '../../src/domain/enum/bet-status.enum'

describe('Round', () => {
  it('should allow placing a bet during betting phase', () => {
    const round = new Round('round-1', 2.5)
    const bet = new Bet('player-1', 1000n)

    round.placeBet(bet)

    expect(round.bets.length).toBe(1)
  })

  it('should not allow duplicate bets from same player', () => {
    const round = new Round('round-1', 2.5)

    const bet1 = new Bet('player-1', 1000n)
    const bet2 = new Bet('player-1', 2000n)

    round.placeBet(bet1)

    expect(() => round.placeBet(bet2)).toThrow(
      'PLAYER_ALREADY_BET',
    )
  })

  it('should not allow betting after round started', () => {
    const round = new Round('round-1', 2.5)

    round.start()

    const bet = new Bet('player-1', 1000n)

    expect(() => round.placeBet(bet)).toThrow(
      'BETTING_CLOSED',
    )
  })

  it('should start round correctly', () => {
    const round = new Round('round-1', 2.5)

    round.start()

    expect(round.status).toBe(RoundStatus.RUNNING)
  })

  it('should not start round twice', () => {
    const round = new Round('round-1', 2.5)

    round.start()

    expect(() => round.start()).toThrow(
      'ROUND_ALREADY_STARTED',
    )
  })

  it('should crash round correctly', () => {
    const round = new Round('round-1', 2.5)

    round.start()
    round.crash()

    expect(round.status).toBe(RoundStatus.CRASHED)
  })

  it('should mark pending bets as lost after crash', () => {
    const round = new Round('round-1', 2.5)

    const bet = new Bet('player-1', 1000n)

    round.placeBet(bet)

    round.start()
    round.crash()

    expect(bet.status).toBe(BetStatus.LOST)
  })

  it('should not crash round before start', () => {
    const round = new Round('round-1', 2.5)

    expect(() => round.crash()).toThrow(
      'ROUND_NOT_RUNNING',
    )
  })
})