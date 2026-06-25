import { describe, expect, it } from "bun:test";
import { Round } from "../../src/domain/entities/round.aggregate";
import { BetStatus } from "../../src/domain/entities/bet-status";
import { RoundStatus } from "../../src/domain/entities/round-status";
import { Money } from "../../src/domain/value-objects/money.vo";
import { Multiplier } from "../../src/domain/value-objects/multiplier.vo";
import {
  BetAmountOutOfRangeError,
  BetOutsideBettingPhaseError,
  CashOutOutsideRunningPhaseError,
  DuplicateBetError,
  InvalidRoundTransitionError,
  NoActiveBetError,
} from "../../src/domain/errors/game.errors";

const now = new Date("2026-01-01T00:00:00Z");
const limits = { minCents: 100n, maxCents: 100_000n };

function openRound(): Round {
  return Round.open({
    id: "round-1",
    nonce: 0,
    serverSeed: "seed",
    serverSeedHash: "hash",
    crashPoint: Multiplier.fromHundredths(250),
    now,
    bettingEndsAt: new Date(now.getTime() + 8000),
  });
}

function placeActiveBet(round: Round, playerId = "p1"): void {
  const bet = round.placeBet({
    betId: `bet-${playerId}`,
    playerId,
    username: playerId,
    amount: Money.fromCents(1000n),
    limits,
    now,
  });
  round.confirmBet(bet.id);
}

describe("Round aggregate", () => {
  it("accepts a bet during the betting phase", () => {
    const round = openRound();
    const bet = round.placeBet({
      betId: "bet-1",
      playerId: "p1",
      username: "alice",
      amount: Money.fromCents(1000n),
      limits,
      now,
    });
    expect(bet.getStatus()).toBe(BetStatus.PENDING);
    expect(round.getBets()).toHaveLength(1);
  });

  it("rejects a second bet from the same player", () => {
    const round = openRound();
    placeActiveBet(round, "p1");
    expect(() => placeActiveBet(round, "p1")).toThrow(DuplicateBetError);
  });

  it("rejects bets outside the [min, max] range", () => {
    const round = openRound();
    expect(() =>
      round.placeBet({
        betId: "b",
        playerId: "p1",
        username: "x",
        amount: Money.fromCents(50n),
        limits,
        now,
      }),
    ).toThrow(BetAmountOutOfRangeError);
    expect(() =>
      round.placeBet({
        betId: "b",
        playerId: "p2",
        username: "x",
        amount: Money.fromCents(200_000n),
        limits,
        now,
      }),
    ).toThrow(BetAmountOutOfRangeError);
  });

  it("forbids betting once the round is running", () => {
    const round = openRound();
    round.start(now);
    expect(() => placeActiveBet(round)).toThrow(BetOutsideBettingPhaseError);
  });

  it("pays out a cash out at the current multiplier", () => {
    const round = openRound();
    placeActiveBet(round, "p1");
    round.start(now);
    const bet = round.cashOut("p1", Multiplier.fromHundredths(200), now);
    expect(bet.getStatus()).toBe(BetStatus.CASHED_OUT);
    expect(bet.getPayout()?.toCents()).toBe(2000n);
  });

  it("forbids cash out when not running or without an active bet", () => {
    const round = openRound();
    placeActiveBet(round, "p1");
    expect(() =>
      round.cashOut("p1", Multiplier.fromHundredths(200), now),
    ).toThrow(CashOutOutsideRunningPhaseError);

    round.start(now);
    expect(() =>
      round.cashOut("ghost", Multiplier.fromHundredths(200), now),
    ).toThrow(NoActiveBetError);
  });

  it("marks active bets as lost on crash and leaves cashed-out ones alone", () => {
    const round = openRound();
    placeActiveBet(round, "winner");
    placeActiveBet(round, "loser");
    round.start(now);
    round.cashOut("winner", Multiplier.fromHundredths(200), now);

    const lost = round.crash(now);
    expect(round.getStatus()).toBe(RoundStatus.CRASHED);
    expect(lost).toHaveLength(1);
    expect(round.getBetByPlayer("loser")?.getStatus()).toBe(BetStatus.LOST);
    expect(round.getBetByPlayer("winner")?.getStatus()).toBe(
      BetStatus.CASHED_OUT,
    );
  });

  it("enforces the state machine BETTING -> RUNNING -> CRASHED", () => {
    const round = openRound();
    expect(() => round.crash(now)).toThrow(InvalidRoundTransitionError);
    round.start(now);
    expect(() => round.start(now)).toThrow(InvalidRoundTransitionError);
    round.crash(now);
    expect(() => round.crash(now)).toThrow(InvalidRoundTransitionError);
  });
});
