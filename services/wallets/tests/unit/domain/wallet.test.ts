import { describe, it, expect } from "bun:test";
import { Wallet } from "@/domain/wallet";
import {
  DuplicateReservationError,
  InsufficientFundsError,
  ReservationNotFoundError,
} from "@/domain/errors";
import { Money } from "@/domain/money";

describe("Wallet", () => {
  describe("reserve", () => {
    it("moves amount from available to reserved", () => {
      const wallet = Wallet.create("player-1");
      const wallet2 = Wallet.reconstitute(
        wallet.id,
        wallet.playerId,
        Money.fromCents(1000),
        new Map(),
      );

      wallet2.reserve("bet-1", Money.fromCents(300));

      expect(wallet2.availableBalance.cents).toBe(700);
      expect(wallet2.reservedBalance.cents).toBe(300);
    });

    it("allows reserving the entire available balance", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(500),
        new Map(),
      );

      wallet.reserve("bet-1", Money.fromCents(500));

      expect(wallet.availableBalance.cents).toBe(0);
      expect(wallet.reservedBalance.cents).toBe(500);
    });

    it("throws InsufficientFundsError when amount exceeds available balance", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(500),
        new Map(),
      );

      expect(() => wallet.reserve("bet-1", Money.fromCents(501))).toThrow(
        InsufficientFundsError,
      );
    });

    it("does not modify balance when InsufficientFundsError is thrown", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(500),
        new Map(),
      );

      expect(() => wallet.reserve("bet-1", Money.fromCents(600))).toThrow();
      expect(wallet.availableBalance.cents).toBe(500);
      expect(wallet.reservedBalance.cents).toBe(0);
    });

    it("throws DuplicateReservationError for duplicate reservationId", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(1000),
        new Map(),
      );

      wallet.reserve("bet-1", Money.fromCents(200));

      expect(() => wallet.reserve("bet-1", Money.fromCents(100))).toThrow(
        DuplicateReservationError,
      );
    });

    it("available balance never goes negative", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(100),
        new Map(),
      );

      expect(() => wallet.reserve("bet-1", Money.fromCents(101))).toThrow();
      expect(wallet.availableBalance.cents).toBeGreaterThanOrEqual(0);
    });
  });

  describe("settleLoss", () => {
    it("removes the reservation without touching available balance", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(700),
        new Map([["bet-1", Money.fromCents(300)]]),
      );

      wallet.settleLoss("bet-1");

      expect(wallet.availableBalance.cents).toBe(700);
      expect(wallet.reservedBalance.cents).toBe(0);
      expect(wallet.reservations.has("bet-1")).toBe(false);
    });

    it("decrements reservedBalance by the settled amount", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(600),
        new Map([
          ["bet-1", Money.fromCents(200)],
          ["bet-2", Money.fromCents(200)],
        ]),
      );

      wallet.settleLoss("bet-1");

      expect(wallet.reservedBalance.cents).toBe(200);
    });

    it("throws ReservationNotFoundError when reservationId does not exist", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(1000),
        new Map(),
      );

      expect(() => wallet.settleLoss("nonexistent")).toThrow(
        ReservationNotFoundError,
      );
    });

    it("does not alter available balance on loss — money is gone", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(0),
        new Map([["bet-1", Money.fromCents(500)]]),
      );

      wallet.settleLoss("bet-1");

      expect(wallet.availableBalance.cents).toBe(0);
    });
  });

  describe("releaseReservation", () => {
    it("returns reserved amount to available balance", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(700),
        new Map([["bet-1", Money.fromCents(300)]]),
      );

      wallet.releaseReservation("bet-1");

      expect(wallet.availableBalance.cents).toBe(1000);
      expect(wallet.reservedBalance.cents).toBe(0);
      expect(wallet.reservations.has("bet-1")).toBe(false);
    });

    it("restores total balance to pre-reserve state", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(400),
        new Map([["bet-1", Money.fromCents(600)]]),
      );

      wallet.releaseReservation("bet-1");

      expect(wallet.availableBalance.cents).toBe(1000);
      expect(wallet.reservedBalance.cents).toBe(0);
    });

    it("only releases the targeted reservation when multiple exist", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(600),
        new Map([
          ["bet-1", Money.fromCents(200)],
          ["bet-2", Money.fromCents(200)],
        ]),
      );

      wallet.releaseReservation("bet-1");

      expect(wallet.availableBalance.cents).toBe(800);
      expect(wallet.reservedBalance.cents).toBe(200);
      expect(wallet.reservations.has("bet-2")).toBe(true);
    });

    it("throws ReservationNotFoundError when reservationId does not exist", () => {
      const wallet = Wallet.reconstitute(
        "w-1",
        "p-1",
        Money.fromCents(1000),
        new Map(),
      );

      expect(() => wallet.releaseReservation("nonexistent")).toThrow(
        ReservationNotFoundError,
      );
    });
  });
});
