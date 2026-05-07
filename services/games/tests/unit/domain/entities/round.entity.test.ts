import { describe, it, expect } from 'bun:test';
import { Round } from '@/domain/entities/round.entity';
import { RoundId } from '@/domain/value-objects/round-id.vo';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { RoundStatus } from '@/domain/enums/round-status.enum';
import { BetId } from '@/domain/value-objects/bet-id.vo';
import { PlayerId } from '@/domain/value-objects/player-id.vo';
import { Money } from '@/domain/value-objects/money.vo';
import { InvalidStateTransitionError } from '@/domain/errors/invalid-state-transition.error';

function makeRound(status: RoundStatus = RoundStatus.BETTING): Round {
  return new Round(
    new RoundId('round-1'),
    status,
    new Multiplier(2.0),
  );
}

describe('Round State Machine', () => {
  describe('valid transitions', () => {
    it('BETTING → RUNNING via start()', () => {
      const round = makeRound(RoundStatus.BETTING);

      round.start();

      expect(round.roundStatus).toBe(RoundStatus.RUNNING);
    });

    it('RUNNING → CRASHED via crash()', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();

      round.crash();

      expect(round.roundStatus).toBe(RoundStatus.CRASHED);
    });

    it('CRASHED → FINISHED via finish()', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();
      round.crash();

      round.finish();

      expect(round.roundStatus).toBe(RoundStatus.FINISHED);
    });

    it('full lifecycle: BETTING → RUNNING → CRASHED → FINISHED', () => {
      const round = makeRound(RoundStatus.BETTING);

      round.start();
      expect(round.roundStatus).toBe(RoundStatus.RUNNING);

      round.crash();
      expect(round.roundStatus).toBe(RoundStatus.CRASHED);

      round.finish();
      expect(round.roundStatus).toBe(RoundStatus.FINISHED);
    });
  });

  describe('invalid transitions', () => {
    it('throws when start() called from RUNNING', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();

      expect(() => round.start()).toThrow(InvalidStateTransitionError);
    });

    it('throws when start() called from CRASHED', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();
      round.crash();

      expect(() => round.start()).toThrow(InvalidStateTransitionError);
    });

    it('throws when crash() called from BETTING', () => {
      const round = makeRound(RoundStatus.BETTING);

      expect(() => round.crash()).toThrow(InvalidStateTransitionError);
    });

    it('throws when crash() called from CRASHED', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();
      round.crash();

      expect(() => round.crash()).toThrow(InvalidStateTransitionError);
    });

    it('throws when crash() called from FINISHED', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();
      round.crash();
      round.finish();

      expect(() => round.crash()).toThrow(InvalidStateTransitionError);
    });

    it('throws when finish() called from RUNNING', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();

      expect(() => round.finish()).toThrow(InvalidStateTransitionError);
    });

    it('throws when finish() called from BETTING', () => {
      const round = makeRound(RoundStatus.BETTING);

      expect(() => round.finish()).toThrow(InvalidStateTransitionError);
    });

    it('throws when finish() called from FINISHED', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();
      round.crash();
      round.finish();

      expect(() => round.finish()).toThrow(InvalidStateTransitionError);
    });
  });

  describe('placeBet', () => {
    it('allows bet during BETTING', () => {
      const round = makeRound(RoundStatus.BETTING);
      const playerId = new PlayerId('player-1');

      const bet = round.placeBet(new BetId('bet-1'), playerId, Money.fromReais(10));

      expect(bet).toBeDefined();
      expect(round.hasBetFromPlayer(playerId)).toBe(true);
    });

    it('throws when placing bet during RUNNING', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();

      expect(() =>
        round.placeBet(new BetId('bet-1'), new PlayerId('player-1'), Money.fromReais(10)),
      ).toThrow(InvalidStateTransitionError);
    });

    it('throws when placing bet during CRASHED', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();
      round.crash();

      expect(() =>
        round.placeBet(new BetId('bet-1'), new PlayerId('player-1'), Money.fromReais(10)),
      ).toThrow(InvalidStateTransitionError);
    });

    it('throws when same player bets twice', () => {
      const round = makeRound(RoundStatus.BETTING);
      const playerId = new PlayerId('player-1');

      round.placeBet(new BetId('bet-1'), playerId, Money.fromReais(10));

      expect(() =>
        round.placeBet(new BetId('bet-2'), playerId, Money.fromReais(20)),
      ).toThrow('Player already has a bet in this round');
    });
  });

  describe('cashOut', () => {
    it('allows cashout during RUNNING', () => {
      const round = makeRound(RoundStatus.BETTING);
      const playerId = new PlayerId('player-1');
      round.placeBet(new BetId('bet-1'), playerId, Money.fromReais(10));
      round.start();

      const bet = round.cashOut(playerId);

      expect(bet.betStatus).toBe('CASHED_OUT');
    });

    it('throws when cashout during BETTING', () => {
      const round = makeRound(RoundStatus.BETTING);

      expect(() => round.cashOut(new PlayerId('player-1'))).toThrow(InvalidStateTransitionError);
    });

    it('throws when cashout during CRASHED', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();
      round.crash();

      expect(() => round.cashOut(new PlayerId('player-1'))).toThrow(InvalidStateTransitionError);
    });

    it('throws when player has no bet', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();

      expect(() => round.cashOut(new PlayerId('nonexistent'))).toThrow('No bet found');
    });
  });

  describe('updateMultiplier', () => {
    it('allows update during RUNNING', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();

      round.updateMultiplier(new Multiplier(1.5));

      expect(round.multiplier.raw).toBe(1.5);
    });

    it('throws when update during BETTING', () => {
      const round = makeRound(RoundStatus.BETTING);

      expect(() => round.updateMultiplier(new Multiplier(1.5))).toThrow(InvalidStateTransitionError);
    });

    it('throws when multiplier decreases', () => {
      const round = makeRound(RoundStatus.BETTING);
      round.start();
      round.updateMultiplier(new Multiplier(1.5));

      expect(() => round.updateMultiplier(new Multiplier(1.3))).toThrow('Multiplier cannot decrease');
    });
  });

  describe('crash side effects', () => {
    it('marks active bets as LOST on crash', () => {
      const round = makeRound(RoundStatus.BETTING);
      const playerId = new PlayerId('player-1');
      round.placeBet(new BetId('bet-1'), playerId, Money.fromReais(10));
      round.start();

      round.crash();

      const bet = round.roundBets.find(b => b.player.equals(playerId));
      expect(bet?.betStatus).toBe('LOST');
    });

    it('does not affect cashed-out bets on crash', () => {
      const round = makeRound(RoundStatus.BETTING);
      const playerId = new PlayerId('player-1');
      round.placeBet(new BetId('bet-1'), playerId, Money.fromReais(10));
      round.start();
      round.cashOut(playerId);
      round.crash();

      const bet = round.roundBets.find(b => b.player.equals(playerId));
      expect(bet?.betStatus).toBe('CASHED_OUT');
    });
  });

  describe('constructor invariants', () => {
    it('throws when crashPoint is less than 1.0', () => {
      expect(() => new Multiplier(0.5)).toThrow('Multiplier must be greater than or equal to 1.0');
    });

    it('accepts crashPoint equal to 1.0', () => {
      const round = new Round(
        new RoundId('round-1'),
        RoundStatus.BETTING,
        new Multiplier(1.0),
      );
      expect(round.roundCrashPoint.raw).toBe(1.0);
    });
  });
});
