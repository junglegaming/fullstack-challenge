import { describe, expect, it } from "bun:test";
import { Round } from "../../../../src/domain/entities/round";
import { BetNotAllowedError } from "../../../../src/domain/errors/bet-not-allowed.error";
import { BetNotFoundError } from "../../../../src/domain/errors/bet-not-found.error";
import { CashOutNotAllowedError } from "../../../../src/domain/errors/cash-out-not-allowed.error";
import { DuplicateBetError } from "../../../../src/domain/errors/duplicate-bet.error";
import { InvalidRoundTransitionError } from "../../../../src/domain/errors/invalid-round-transition.error";
import { BetStatus, RoundStatus } from "../../../../src/domain/value-objects/round-status";
import { Money } from "../../../../src/domain/value-objects/money";
import { Multiplier } from "../../../../src/domain/value-objects/multiplier";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";

describe("Round", () => {
  const playerOne = PlayerId.create("player-1");
  const playerTwo = PlayerId.create("player-2");
  const bettingStartedAt = new Date("2026-06-14T12:00:00.000Z");
  const bettingOpenAt = new Date("2026-06-14T12:00:00.000Z");
  const bettingEndsAt = new Date("2026-06-14T12:00:10.000Z");
  const runningAt = new Date("2026-06-14T12:00:11.000Z");
  const crashedAt = new Date("2026-06-14T12:00:20.000Z");
  const settledAt = new Date("2026-06-14T12:00:21.000Z");

  function createRound(): Round {
    return Round.create({
      serverSeedHash: "hash",
      clientSeed: "client-seed",
      nonce: 1,
      crashPoint: Multiplier.fromBasisPoints(300),
      bettingStartedAt,
      bettingEndsAt,
    });
  }

  function placeConfirmedBet(
    round: Round,
    playerId: PlayerId,
    amountCents: bigint,
    idempotencyKey: string,
  ): void {
    const bet = round.placeBet({
      playerId,
      amount: Money.fromCents(amountCents),
      idempotencyKey,
      now: bettingOpenAt,
    });

    round.confirmBetPlaced(bet.id);
  }

  it("starts in BETTING status", () => {
    const round = createRound();

    expect(round.status).toBe(RoundStatus.BETTING);
  });

  it("accepts bets only during BETTING phase", () => {
    const round = createRound();

    placeConfirmedBet(round, playerOne, 1000n, "bet-1");
    round.start(runningAt);

    expect(() =>
      round.placeBet({
        playerId: playerTwo,
        amount: Money.fromCents(1000n),
        idempotencyKey: "bet-2",
        now: runningAt,
      }),
    ).toThrow(BetNotAllowedError);
  });

  it("rejects duplicate bet from same player", () => {
    const round = createRound();

    round.placeBet({
      playerId: playerOne,
      amount: Money.fromCents(1000n),
      idempotencyKey: "bet-1",
      now: bettingOpenAt,
    });

    expect(() =>
      round.placeBet({
        playerId: playerOne,
        amount: Money.fromCents(2000n),
        idempotencyKey: "bet-2",
        now: bettingOpenAt,
      }),
    ).toThrow(DuplicateBetError);
  });

  it("rejects bet after betting window closes", () => {
    const round = createRound();

    expect(() =>
      round.placeBet({
        playerId: playerOne,
        amount: Money.fromCents(1000n),
        idempotencyKey: "bet-1",
        now: bettingEndsAt,
      }),
    ).toThrow(BetNotAllowedError);
  });

  it("follows valid round lifecycle transitions", () => {
    const round = createRound();

    round.start(runningAt);
    expect(round.status).toBe(RoundStatus.RUNNING);

    round.crash(crashedAt);
    expect(round.status).toBe(RoundStatus.CRASHED);

    round.settle(settledAt);
    expect(round.status).toBe(RoundStatus.SETTLED);
  });

  it("rejects invalid round transitions", () => {
    const round = createRound();

    expect(() => round.crash(crashedAt)).toThrow(InvalidRoundTransitionError);
    expect(() => round.settle(settledAt)).toThrow(InvalidRoundTransitionError);
  });

  it("allows cash out only during RUNNING phase", () => {
    const round = createRound();
    placeConfirmedBet(round, playerOne, 1000n, "bet-1");

    expect(() =>
      round.cashOut({
        playerId: playerOne,
        currentMultiplier: Multiplier.fromBasisPoints(150),
        payoutCreditIdempotencyKey: "credit-idempotency-1",
      }),
    ).toThrow(CashOutNotAllowedError);

    round.start(runningAt);

    const cashedOutBet = round.cashOut({
      playerId: playerOne,
      currentMultiplier: Multiplier.fromBasisPoints(150),
      payoutCreditIdempotencyKey: "credit-idempotency-1",
    });

    expect(cashedOutBet.status).toBe(BetStatus.CASHED_OUT);
    expect(cashedOutBet.payout?.amountInCents).toBe(1500n);
  });

  it("calculates current multiplier from server time", () => {
    const round = createRound();

    expect(round.getCurrentMultiplier(bettingOpenAt).toDecimalString()).toBe("1.00");

    round.start(runningAt);

    expect(
      round
        .getCurrentMultiplier(new Date(runningAt.getTime() + 1500), {
          growthBasisPointsPerSecond: 100,
        })
        .toDecimalString(),
    ).toBe("2.50");
  });

  it("caps current multiplier at crash point", () => {
    const round = createRound();
    round.start(runningAt);

    expect(
      round
        .getCurrentMultiplier(new Date(runningAt.getTime() + 10_000), {
          growthBasisPointsPerSecond: 100,
        })
        .toDecimalString(),
    ).toBe("3.00");
  });

  it("rejects cash out without a placed bet", () => {
    const round = createRound();
    round.start(runningAt);

    expect(() =>
      round.cashOut({
        playerId: playerOne,
        currentMultiplier: Multiplier.fromBasisPoints(150),
        payoutCreditIdempotencyKey: "credit-idempotency-1",
      }),
    ).toThrow(BetNotFoundError);
  });

  it("rejects cash out when multiplier exceeds crash point", () => {
    const round = createRound();
    placeConfirmedBet(round, playerOne, 1000n, "bet-1");
    round.start(runningAt);

    expect(() =>
      round.cashOut({
        playerId: playerOne,
        currentMultiplier: Multiplier.fromBasisPoints(350),
        payoutCreditIdempotencyKey: "credit-idempotency-1",
      }),
    ).toThrow(CashOutNotAllowedError);
  });

  it("marks placed bets as lost on crash and keeps cashed out bets unchanged", () => {
    const round = createRound();
    placeConfirmedBet(round, playerOne, 1000n, "bet-1");
    placeConfirmedBet(round, playerTwo, 2000n, "bet-2");

    round.start(runningAt);

    round.cashOut({
      playerId: playerOne,
      currentMultiplier: Multiplier.fromBasisPoints(180),
      payoutCreditIdempotencyKey: "credit-idempotency-1",
    });

    round.crash(crashedAt);

    const winnerBet = round.bets.find((bet) => bet.playerId.equals(playerOne));
    const loserBet = round.bets.find((bet) => bet.playerId.equals(playerTwo));

    expect(winnerBet?.status).toBe(BetStatus.CASHED_OUT);
    expect(loserBet?.status).toBe(BetStatus.LOST);
  });
});
