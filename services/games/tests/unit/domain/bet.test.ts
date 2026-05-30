import { describe, it, expect } from "bun:test";
import { Bet, BetStatus } from "@/domain/bet";
import { AlreadyCashedOutError } from "@/domain/errors";
import { Money } from "@/domain/money";

const makeBet = (amount = 1000) =>
  Bet.create("bet-1", "round-1", "player-1", Money.fromCents(amount));

describe("Bet", () => {
  describe("create", () => {
    it("creates a bet with PENDING status", () => {
      const bet = makeBet();
      expect(bet.status).toBe(BetStatus.PENDING);
    });

    it("stores the amount, ids, and null payout", () => {
      const bet = makeBet(500);
      expect(bet.id).toBe("bet-1");
      expect(bet.roundId).toBe("round-1");
      expect(bet.playerId).toBe("player-1");
      expect(bet.amount.cents).toBe(500);
      expect(bet.payout).toBeNull();
    });
  });

  describe("reconstitute", () => {
    it("restores a cashed-out bet with its payout", () => {
      const bet = Bet.reconstitute(
        "bet-1",
        "round-1",
        "player-1",
        Money.fromCents(1000),
        BetStatus.CASHED_OUT,
        Money.fromCents(2500),
      );
      expect(bet.status).toBe(BetStatus.CASHED_OUT);
      expect(bet.payout?.cents).toBe(2500);
    });

    it("restores a lost bet", () => {
      const bet = Bet.reconstitute(
        "bet-1",
        "round-1",
        "player-1",
        Money.fromCents(1000),
        BetStatus.LOST,
        null,
      );
      expect(bet.status).toBe(BetStatus.LOST);
      expect(bet.payout).toBeNull();
    });
  });

  describe("calculatePayout", () => {
    it("returns amount × multiplier in integer cents", () => {
      const bet = makeBet(1000);
      expect(bet.calculatePayout(2.5).cents).toBe(2500);
    });

    it("floors fractional cents", () => {
      // 1000 * 1.337 = 1337.0 exact → no fractions here
      // 300 * 1.337 = 401.1 → floor to 401
      const bet = makeBet(300);
      expect(bet.calculatePayout(1.337).cents).toBe(401);
    });

    it("returns the original amount at 1.00x multiplier", () => {
      const bet = makeBet(750);
      expect(bet.calculatePayout(1.0).cents).toBe(750);
    });

    it("does not mutate the bet status", () => {
      const bet = makeBet();
      bet.calculatePayout(3.0);
      expect(bet.status).toBe(BetStatus.PENDING);
    });
  });

  describe("cashOut", () => {
    it("marks the bet as CASHED_OUT and stores the payout", () => {
      const bet = makeBet(1000);
      const payout = bet.cashOut(2.0);
      expect(bet.status).toBe(BetStatus.CASHED_OUT);
      expect(payout.cents).toBe(2000);
      expect(bet.payout?.cents).toBe(2000);
    });

    it("throws AlreadyCashedOutError on a second cashout attempt", () => {
      const bet = makeBet(1000);
      bet.cashOut(2.0);
      expect(() => bet.cashOut(3.0)).toThrow(AlreadyCashedOutError);
    });

    it("payout is floored to integer cents", () => {
      const bet = makeBet(300);
      const payout = bet.cashOut(1.337);
      expect(payout.cents).toBe(401);
    });
  });

  describe("lose", () => {
    it("marks the bet as LOST", () => {
      const bet = makeBet();
      bet.lose();
      expect(bet.status).toBe(BetStatus.LOST);
    });

    it("does not change the amount", () => {
      const bet = makeBet(800);
      bet.lose();
      expect(bet.amount.cents).toBe(800);
    });
  });
});
