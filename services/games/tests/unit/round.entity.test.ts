import { describe, test, expect } from "bun:test";
import { Round } from "../../src/domain/entities/round.entity";
import { RoundId } from "../../src/domain/value-objects/round-id.vo";
import { Multiplier } from "../../src/domain/value-objects/multiplier.vo";
import { RoundStatus } from "../../src/domain/enums/round-status.enum";
import { PlayerId } from "../../src/domain/value-objects/player-id.vo";
import { BetId } from "../../src/domain/value-objects/bet-id.vo";
import { Money } from "../../src/domain/value-objects/money.vo";
import { RoundSeed } from "../../src/domain/value-objects/round-seed.vo";
import { InvalidStateTransitionError } from "../../src/domain/errors/invalid-state-transition.error";

describe("Round", () => {
  const roundId = new RoundId("round-1");
  const crashPoint = new Multiplier(2.0);
  const seed = RoundSeed.create("server-seed-1", "nonce-1", "client-seed-1");

  test("should create a round with betting status", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    expect(round.roundId.raw).toBe("round-1");
    expect(round.roundStatus).toBe(RoundStatus.BETTING);
    expect(round.roundCrashPoint.raw).toBe(2.0);
    expect(round.multiplier.raw).toBe(1.0);
  });

  test("should not create round with crash point less than 1.0", () => {
    expect(() => new Round(roundId, RoundStatus.BETTING, new Multiplier(0.5))).toThrow();
  });

  test("should transition from betting to running", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    round.start();
    expect(round.roundStatus).toBe(RoundStatus.RUNNING);
  });

  test("should not start round that is not in betting status", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    round.start();
    expect(() => round.start()).toThrow(InvalidStateTransitionError);
  });

  test("should update multiplier when running", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    round.start();
    round.updateMultiplier(new Multiplier(1.5));
    expect(round.multiplier.raw).toBe(1.5);
  });

  test("should not update multiplier when not running", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    expect(() => round.updateMultiplier(new Multiplier(1.5))).toThrow(InvalidStateTransitionError);
  });

  test("should not decrease multiplier", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    round.start();
    round.updateMultiplier(new Multiplier(1.5));
    expect(() => round.updateMultiplier(new Multiplier(1.2))).toThrow();
  });

  test("should crash round", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    round.start();
    round.crash();
    expect(round.roundStatus).toBe(RoundStatus.CRASHED);
  });

  test("should mark active bets as lost on crash", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    const playerId = new PlayerId("player-1");
    const betId = new BetId("bet-1");
    const bet = round.placeBet(betId, playerId, new Money(1000n));
    expect(bet.betStatus).toBe("ACTIVE");
    round.start();
    round.crash();
    expect(bet.betStatus).toBe("LOST");
  });

  test("should finish round", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    round.start();
    round.crash();
    round.finish();
    expect(round.roundStatus).toBe(RoundStatus.FINISHED);
  });

  test("should place bet during betting phase", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    const playerId = new PlayerId("player-1");
    const betId = new BetId("bet-1");
    const bet = round.placeBet(betId, playerId, new Money(1000n));
    expect(bet.betStatus).toBe("ACTIVE");
    expect(bet.betAmount.amount).toBe(1000n);
  });

  test("should not place bet outside betting phase", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    round.start();
    const playerId = new PlayerId("player-1");
    const betId = new BetId("bet-1");
    expect(() => round.placeBet(betId, playerId, new Money(1000n))).toThrow(InvalidStateTransitionError);
  });

  test("should not place duplicate bet from same player", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    const playerId = new PlayerId("player-1");
    const betId1 = new BetId("bet-1");
    const betId2 = new BetId("bet-2");
    round.placeBet(betId1, playerId, new Money(1000n));
    expect(() => round.placeBet(betId2, playerId, new Money(2000n))).toThrow();
  });

  test("should cash out during running phase", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    const playerId = new PlayerId("player-1");
    const betId = new BetId("bet-1");
    round.placeBet(betId, playerId, new Money(1000n));
    round.start();
    round.updateMultiplier(new Multiplier(1.5));
    const bet = round.cashOut(playerId);
    expect(bet.betStatus).toBe("CASHED_OUT");
    expect(bet.cashoutMultiplierValue?.raw).toBe(1.5);
  });

  test("should calculate payout on cash out", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    const playerId = new PlayerId("player-1");
    const betId = new BetId("bet-1");
    round.placeBet(betId, playerId, new Money(1000n));
    round.start();
    round.updateMultiplier(new Multiplier(2.0));
    const bet = round.cashOut(playerId);
    expect(bet.payout.amount).toBe(2000n); // 1000 * 2.0 = 2000
  });

  test("should not cash out without bet", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    round.start();
    const playerId = new PlayerId("player-2");
    expect(() => round.cashOut(playerId)).toThrow();
  });

  test("should not cash out outside running phase", () => {
    const round = new Round(roundId, RoundStatus.BETTING, crashPoint, seed);
    const playerId = new PlayerId("player-1");
    const betId = new BetId("bet-1");
    round.placeBet(betId, playerId, new Money(1000n));
    expect(() => round.cashOut(playerId)).toThrow(InvalidStateTransitionError);
  });
});
