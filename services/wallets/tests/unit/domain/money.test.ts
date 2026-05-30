import { describe, it, expect } from "bun:test";
import {
  Money,
  NegativeAmountError,
  NonIntegerAmountError,
  NegativeResultError,
} from "@/domain/money";

describe("Money", () => {
  describe("fromCents", () => {
    it("creates a Money instance and exposes cents correctly", () => {
      const m = Money.fromCents(1000);
      expect(m.cents).toBe(1000);
    });

    it("accepts zero", () => {
      const m = Money.fromCents(0);
      expect(m.cents).toBe(0);
    });

    it("throws NegativeAmountError for negative value", () => {
      expect(() => Money.fromCents(-1)).toThrow(NegativeAmountError);
    });

    it("throws NonIntegerAmountError for fractional cents", () => {
      expect(() => Money.fromCents(10.5)).toThrow(NonIntegerAmountError);
    });
  });

  describe("add", () => {
    it("returns a new Money with the sum of both amounts", () => {
      const a = Money.fromCents(300);
      const b = Money.fromCents(200);
      expect(a.add(b).cents).toBe(500);
    });

    it("does not mutate the original instances", () => {
      const a = Money.fromCents(300);
      const b = Money.fromCents(200);
      a.add(b);
      expect(a.cents).toBe(300);
      expect(b.cents).toBe(200);
    });
  });

  describe("subtract", () => {
    it("returns a new Money with the difference", () => {
      const a = Money.fromCents(500);
      const b = Money.fromCents(200);
      expect(a.subtract(b).cents).toBe(300);
    });

    it("returns zero when both amounts are equal", () => {
      const a = Money.fromCents(400);
      const b = Money.fromCents(400);
      expect(a.subtract(b).cents).toBe(0);
    });

    it("throws NegativeResultError when result would be negative", () => {
      const a = Money.fromCents(100);
      const b = Money.fromCents(200);
      expect(() => a.subtract(b)).toThrow(NegativeResultError);
    });

    it("does not mutate the original instances", () => {
      const a = Money.fromCents(500);
      const b = Money.fromCents(200);
      a.subtract(b);
      expect(a.cents).toBe(500);
      expect(b.cents).toBe(200);
    });
  });

  describe("isGreaterThan", () => {
    it("returns true when this is greater than other", () => {
      expect(Money.fromCents(500).isGreaterThan(Money.fromCents(300))).toBe(true);
    });

    it("returns false when this is equal to other", () => {
      expect(Money.fromCents(300).isGreaterThan(Money.fromCents(300))).toBe(false);
    });

    it("returns false when this is less than other", () => {
      expect(Money.fromCents(100).isGreaterThan(Money.fromCents(300))).toBe(false);
    });
  });

  describe("isGreaterThanOrEqual", () => {
    it("returns true when this is greater than other", () => {
      expect(Money.fromCents(500).isGreaterThanOrEqual(Money.fromCents(300))).toBe(true);
    });

    it("returns true when this is equal to other", () => {
      expect(Money.fromCents(300).isGreaterThanOrEqual(Money.fromCents(300))).toBe(true);
    });

    it("returns false when this is less than other", () => {
      expect(Money.fromCents(100).isGreaterThanOrEqual(Money.fromCents(300))).toBe(false);
    });
  });

  describe("equals", () => {
    it("returns true when both have the same amount", () => {
      expect(Money.fromCents(250).equals(Money.fromCents(250))).toBe(true);
    });

    it("returns false when amounts differ", () => {
      expect(Money.fromCents(250).equals(Money.fromCents(251))).toBe(false);
    });
  });
});
