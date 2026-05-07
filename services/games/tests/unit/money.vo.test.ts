import { describe, test, expect } from "bun:test";
import { Money } from "../../src/domain/value-objects/money.vo";

describe("Money", () => {
  test("should create from cents (bigint)", () => {
    const money = new Money(1000n);
    expect(money.amount).toBe(1000n);
    expect(money.reaisString).toBe("10.00");
  });

  test("should create from cents (number)", () => {
    const money = new Money(1000);
    expect(money.amount).toBe(1000n);
    expect(money.reaisString).toBe("10.00");
  });

  test("should create from reais", () => {
    const money = Money.fromReais(10.50);
    expect(money.amount).toBe(1050n);
    expect(money.reaisString).toBe("10.50");
  });

  test("should not create negative money", () => {
    expect(() => new Money(-100n)).toThrow();
  });

  test("should add money", () => {
    const a = new Money(1000n);
    const b = new Money(500n);
    const sum = a.add(b);
    expect(sum.amount).toBe(1500n);
    expect(sum.reaisString).toBe("15.00");
  });

  test("should subtract money", () => {
    const a = new Money(1000n);
    const b = new Money(500n);
    const diff = a.subtract(b);
    expect(diff.amount).toBe(500n);
    expect(diff.reaisString).toBe("5.00");
  });

  test("should not subtract more than balance", () => {
    const a = new Money(500n);
    const b = new Money(1000n);
    expect(() => a.subtract(b)).toThrow();
  });

  test("should multiply by multiplier (string)", () => {
    const money = new Money(1000n);
    const result = money.multiply("2.5");
    expect(result.amount).toBe(2500n); // 1000 * 2.5 = 2500
  });

  test("should multiply by multiplier (bigint)", () => {
    const money = new Money(1000n);
    const result = money.multiply(2n);
    expect(result.amount).toBe(2000n);
  });

  test("should compare money", () => {
    const a = new Money(1000n);
    const b = new Money(500n);
    expect(a.isGreaterThan(b)).toBe(true);
    expect(b.isLessThan(a)).toBe(true);
    expect(a.equals(new Money(1000n))).toBe(true);
  });

  test("zero should return zero money", () => {
    const zero = Money.zero();
    expect(zero.amount).toBe(0n);
    expect(zero.reaisString).toBe("0.00");
  });
});
