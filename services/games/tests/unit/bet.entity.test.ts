import { describe, test, expect } from "bun:test";
import { Bet } from "../../src/domain/entities/bet.entity";
import { BetId } from "../../src/domain/value-objects/bet-id.vo";
import { PlayerId } from "../../src/domain/value-objects/player-id.vo";
import { Money } from "../../src/domain/value-objects/money.vo";
import { Multiplier } from "../../src/domain/value-objects/multiplier.vo";

describe("Bet", () => {
  const betId = new BetId("bet-1");
  const playerId = new PlayerId("player-1");
  const amount = new Money(1000n); // 10.00

  test("should create bet with active status", () => {
    const bet = new Bet(betId, playerId, amount);
    expect(bet.betStatus).toBe("ACTIVE");
    expect(bet.betAmount.amount).toBe(1000n);
    expect(bet.cashoutMultiplierValue).toBeNull();
  });

  test("should cash out bet", () => {
    const bet = new Bet(betId, playerId, amount);
    const multiplier = new Multiplier(1.5);
    bet.cashOut(multiplier);
    expect(bet.betStatus).toBe("CASHED_OUT");
    expect(bet.cashoutMultiplierValue?.raw).toBe(1.5);
  });

  test("should not cash out already cashed out bet", () => {
    const bet = new Bet(betId, playerId, amount);
    bet.cashOut(new Multiplier(1.5));
    expect(() => bet.cashOut(new Multiplier(2.0))).toThrow();
  });

  test("should mark bet as lost", () => {
    const bet = new Bet(betId, playerId, amount);
    bet.lose();
    expect(bet.betStatus).toBe("LOST");
  });

  test("should not lose already cashed out bet", () => {
    const bet = new Bet(betId, playerId, amount);
    bet.cashOut(new Multiplier(1.5));
    bet.lose(); // should not change status
    expect(bet.betStatus).toBe("CASHED_OUT");
  });

  test("should calculate payout after cash out", () => {
    const bet = new Bet(betId, playerId, new Money(1000n));
    bet.cashOut(new Multiplier(2.0));
    expect(bet.payout.amount).toBe(2000n); // 1000 * 2.0 = 2000
  });

  test("should return zero payout if not cashed out", () => {
    const bet = new Bet(betId, playerId, amount);
    expect(bet.payout.amount).toBe(0n);
  });
});
