import { describe, it, expect } from "bun:test";
import { Round, RoundState } from "@/domain/round";
import { BetStatus } from "@/domain/bet";
import {
  AlreadyCashedOutError,
  BetAlreadyPlacedError,
  BetNotFoundError,
  BettingClosedError,
  CashoutNotAllowedError,
  InvalidRoundStateError,
} from "@/domain/errors";
import { Money } from "@/domain/money";

const makeRound = () =>
  Round.create("round-1", "seed-abc", "hash-abc", 2.45);

const makeRoundWithBet = () => {
  const round = makeRound();
  round.placeBet("bet-1", "player-1", Money.fromCents(1000));
  return round;
};

const makeRunningRound = () => {
  const round = makeRoundWithBet();
  round.start();
  return round;
};

describe("Round", () => {
  describe("create", () => {
    it("initialises in BETTING state with no bets", () => {
      const round = makeRound();
      expect(round.state).toBe(RoundState.BETTING);
      expect(round.bets.size).toBe(0);
      expect(round.startedAt).toBeNull();
    });

    it("stores seed, hash, and crash point from construction", () => {
      const round = makeRound();
      expect(round.seed).toBe("seed-abc");
      expect(round.hash).toBe("hash-abc");
      expect(round.crashPoint).toBe(2.45);
    });
  });

  describe("reconstitute", () => {
    it("restores state, bets, and startedAt", () => {
      const startedAt = new Date("2024-01-01T10:00:00Z");
      const round = Round.reconstitute(
        "round-1",
        RoundState.RUNNING,
        "seed",
        "hash",
        3.0,
        startedAt,
        [],
      );
      expect(round.state).toBe(RoundState.RUNNING);
      expect(round.startedAt).toEqual(startedAt);
    });
  });

  describe("placeBet", () => {
    it("adds a bet in BETTING state", () => {
      const round = makeRound();
      round.placeBet("bet-1", "player-1", Money.fromCents(500));
      expect(round.bets.size).toBe(1);
      expect(round.bets.get("player-1")?.amount.cents).toBe(500);
    });

    it("allows multiple players to bet in the same round", () => {
      const round = makeRound();
      round.placeBet("bet-1", "player-1", Money.fromCents(500));
      round.placeBet("bet-2", "player-2", Money.fromCents(300));
      expect(round.bets.size).toBe(2);
    });

    it("throws BettingClosedError in RUNNING state", () => {
      const round = makeRunningRound();
      expect(() =>
        round.placeBet("bet-2", "player-2", Money.fromCents(200)),
      ).toThrow(BettingClosedError);
    });

    it("throws BettingClosedError in CRASHED state", () => {
      const round = makeRunningRound();
      round.crash();
      expect(() =>
        round.placeBet("bet-2", "player-2", Money.fromCents(200)),
      ).toThrow(BettingClosedError);
    });

    it("throws BetAlreadyPlacedError when same player bets twice", () => {
      const round = makeRound();
      round.placeBet("bet-1", "player-1", Money.fromCents(500));
      expect(() =>
        round.placeBet("bet-2", "player-1", Money.fromCents(200)),
      ).toThrow(BetAlreadyPlacedError);
    });

    it("does not mutate existing bets when BetAlreadyPlacedError is thrown", () => {
      const round = makeRound();
      round.placeBet("bet-1", "player-1", Money.fromCents(500));
      expect(() =>
        round.placeBet("bet-2", "player-1", Money.fromCents(200)),
      ).toThrow();
      expect(round.bets.get("player-1")?.amount.cents).toBe(500);
    });
  });

  describe("start", () => {
    it("transitions BETTING → RUNNING and sets startedAt", () => {
      const round = makeRound();
      const before = new Date();
      round.start();
      const after = new Date();
      expect(round.state).toBe(RoundState.RUNNING);
      expect(round.startedAt).not.toBeNull();
      expect(round.startedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(round.startedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("throws InvalidRoundStateError when called in RUNNING", () => {
      const round = makeRound();
      round.start();
      expect(() => round.start()).toThrow(InvalidRoundStateError);
    });

    it("throws InvalidRoundStateError when called in CRASHED", () => {
      const round = makeRunningRound();
      round.crash();
      expect(() => round.start()).toThrow(InvalidRoundStateError);
    });
  });

  describe("cashOut", () => {
    it("returns the payout and marks the bet as CASHED_OUT", () => {
      const round = makeRunningRound();
      const payout = round.cashOut("player-1", 2.5);
      expect(payout.cents).toBe(2500);
      expect(round.bets.get("player-1")?.status).toBe(BetStatus.CASHED_OUT);
    });

    it("throws CashoutNotAllowedError in BETTING state", () => {
      const round = makeRoundWithBet();
      expect(() => round.cashOut("player-1", 2.0)).toThrow(CashoutNotAllowedError);
    });

    it("throws CashoutNotAllowedError in CRASHED state", () => {
      const round = makeRunningRound();
      round.crash();
      expect(() => round.cashOut("player-1", 2.0)).toThrow(CashoutNotAllowedError);
    });

    it("throws BetNotFoundError when player has no bet in this round", () => {
      const round = makeRunningRound();
      expect(() => round.cashOut("unknown-player", 2.0)).toThrow(BetNotFoundError);
    });

    it("throws AlreadyCashedOutError on a second cashout attempt", () => {
      const round = makeRunningRound();
      round.cashOut("player-1", 2.0);
      expect(() => round.cashOut("player-1", 3.0)).toThrow(AlreadyCashedOutError);
    });

    it("payout is floored to integer cents", () => {
      const round = Round.create("r-1", "s", "h", 5.0);
      round.placeBet("bet-1", "player-1", Money.fromCents(300));
      round.start();
      const payout = round.cashOut("player-1", 1.337);
      expect(payout.cents).toBe(401);
    });
  });

  describe("crash", () => {
    it("transitions RUNNING → CRASHED", () => {
      const round = makeRunningRound();
      round.crash();
      expect(round.state).toBe(RoundState.CRASHED);
    });

    it("marks all PENDING bets as LOST and returns them", () => {
      const round = Round.create("r-1", "s", "h", 2.0);
      round.placeBet("bet-1", "player-1", Money.fromCents(500));
      round.placeBet("bet-2", "player-2", Money.fromCents(300));
      round.start();
      const lost = round.crash();
      expect(lost).toHaveLength(2);
      expect(round.bets.get("player-1")?.status).toBe(BetStatus.LOST);
      expect(round.bets.get("player-2")?.status).toBe(BetStatus.LOST);
    });

    it("does not mark already CASHED_OUT bets as LOST", () => {
      const round = Round.create("r-1", "s", "h", 5.0);
      round.placeBet("bet-1", "player-1", Money.fromCents(500));
      round.placeBet("bet-2", "player-2", Money.fromCents(300));
      round.start();
      round.cashOut("player-1", 2.0);
      const lost = round.crash();
      expect(lost).toHaveLength(1);
      expect(lost[0].playerId).toBe("player-2");
      expect(round.bets.get("player-1")?.status).toBe(BetStatus.CASHED_OUT);
    });

    it("returns empty array when all players cashed out", () => {
      const round = makeRunningRound();
      round.cashOut("player-1", 2.0);
      const lost = round.crash();
      expect(lost).toHaveLength(0);
    });

    it("throws InvalidRoundStateError when called in BETTING", () => {
      const round = makeRound();
      expect(() => round.crash()).toThrow(InvalidRoundStateError);
    });

    it("throws InvalidRoundStateError when called in CRASHED", () => {
      const round = makeRunningRound();
      round.crash();
      expect(() => round.crash()).toThrow(InvalidRoundStateError);
    });
  });
});
