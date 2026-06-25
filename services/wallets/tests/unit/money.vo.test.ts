import { describe, expect, it } from "bun:test";
import { Money } from "../../src/domain/value-objects/money.vo";
import { InvalidMoneyError } from "../../src/domain/errors/wallet.errors";

describe("Money", () => {
  it("parses a decimal string into integer cents without floats", () => {
    expect(Money.fromDecimalString("1234.56").toCents()).toBe(123456n);
    expect(Money.fromDecimalString("10").toCents()).toBe(1000n);
    expect(Money.fromDecimalString("0.05").toCents()).toBe(5n);
    expect(Money.fromDecimalString("0.5").toCents()).toBe(50n);
  });

  it("formats cents back to a decimal string", () => {
    expect(Money.fromCents(123456n).toDecimalString()).toBe("1234.56");
    expect(Money.fromCents(5n).toDecimalString()).toBe("0.05");
    expect(Money.fromCents(0n).toDecimalString()).toBe("0.00");
  });

  it("avoids floating point drift across many additions", () => {

    let total = Money.zero();
    total = total.add(Money.fromDecimalString("0.10"));
    total = total.add(Money.fromDecimalString("0.20"));
    expect(total.toCents()).toBe(30n);
    expect(total.toDecimalString()).toBe("0.30");
  });

  it("supports add and subtract on integer cents", () => {
    const a = Money.fromCents(100n);
    const b = Money.fromCents(30n);
    expect(a.add(b).toCents()).toBe(130n);
    expect(a.subtract(b).toCents()).toBe(70n);
  });

  it("compares amounts", () => {
    expect(Money.fromCents(100n).isGreaterThanOrEqual(Money.fromCents(100n))).toBe(true);
    expect(Money.fromCents(99n).isLessThan(Money.fromCents(100n))).toBe(true);
    expect(Money.fromCents(0n).isZero()).toBe(true);
    expect(Money.fromCents(1n).isPositive()).toBe(true);
    expect(Money.fromCents(-1n).isNegative()).toBe(true);
  });

  it("rejects malformed monetary strings", () => {
    expect(() => Money.fromDecimalString("1.234")).toThrow(InvalidMoneyError);
    expect(() => Money.fromDecimalString("abc")).toThrow(InvalidMoneyError);
    expect(() => Money.fromDecimalString("")).toThrow(InvalidMoneyError);
  });
});
