import { describe, expect, it } from "bun:test";
import { Bet } from "../../../../src/domain/entities/bet";
import { InvalidBetAmountError } from "../../../../src/domain/errors/invalid-bet-amount.error";
import { InvalidBetTransitionError } from "../../../../src/domain/errors/invalid-bet-transition.error";
import { BetStatus } from "../../../../src/domain/value-objects/round-status";
import { Money } from "../../../../src/domain/value-objects/money";
import { Multiplier } from "../../../../src/domain/value-objects/multiplier";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { RoundId } from "../../../../src/domain/value-objects/round-id";

describe("Bet", () => {
  const roundId = RoundId.create("round-1");
  const playerId = PlayerId.create("player-1");

  function createPendingBet(amountCents: bigint): Bet {
    return Bet.createPending({
      roundId,
      playerId,
      amount: Money.fromCents(amountCents),
      idempotencyKey: "bet-1",
    });
  }

  it("creates pending bet within allowed amount range", () => {
    const bet = createPendingBet(5000n);

    expect(bet.status).toBe(BetStatus.PENDING_DEBIT);
    expect(bet.amount.amountInCents).toBe(5000n);
  });

  it("rejects bet below minimum amount", () => {
    expect(() => createPendingBet(50n)).toThrow(InvalidBetAmountError);
  });

  it("rejects bet above maximum amount", () => {
    expect(() => createPendingBet(100001n)).toThrow(InvalidBetAmountError);
  });

  it("transitions from pending debit to placed", () => {
    const bet = createPendingBet(1000n);

    bet.markPlaced();

    expect(bet.status).toBe(BetStatus.PLACED);
  });

  it("calculates cash out payout with bigint math", () => {
    const bet = createPendingBet(1000n);
    bet.markPlaced();

    bet.cashOut(Multiplier.fromBasisPoints(250));

    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.payout?.amountInCents).toBe(2500n);
    expect(bet.cashOutMultiplier?.toDisplayString()).toBe("2.50");
  });

  it("prevents cashed out bet from becoming lost", () => {
    const bet = createPendingBet(1000n);
    bet.markPlaced();
    bet.cashOut(Multiplier.fromBasisPoints(150));

    expect(() => bet.markLost()).toThrow(InvalidBetTransitionError);
  });

  it("prevents lost bet from being cashed out", () => {
    const bet = createPendingBet(1000n);
    bet.markPlaced();
    bet.markLost();

    expect(() => bet.cashOut(Multiplier.fromBasisPoints(150))).toThrow(
      InvalidBetTransitionError,
    );
  });
});
