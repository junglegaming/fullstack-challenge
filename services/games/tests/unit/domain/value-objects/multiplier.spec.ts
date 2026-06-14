import { describe, expect, it } from "bun:test";
import { Money } from "../../../../src/domain/value-objects/money";
import { Multiplier } from "../../../../src/domain/value-objects/multiplier";

describe("Multiplier", () => {
  it("represents 1.00x as 100 basis points", () => {
    const multiplier = Multiplier.one();

    expect(multiplier.valueInBasisPoints).toBe(100);
    expect(multiplier.toDisplayString()).toBe("1.00");
  });

  it("formats multiplier display without floating point", () => {
    const multiplier = Multiplier.fromBasisPoints(247);

    expect(multiplier.toDisplayString()).toBe("2.47");
  });

  it("calculates payout using bigint cents", () => {
    const betAmount = Money.fromCents(1000n);
    const multiplier = Multiplier.fromBasisPoints(150);

    const payout = multiplier.calculatePayout(betAmount);

    expect(payout.amountInCents).toBe(1500n);
  });

  it("rejects multiplier below 1.00x", () => {
    expect(() => Multiplier.fromBasisPoints(99)).toThrow();
  });

  it("compares multipliers for cash out validation", () => {
    const current = Multiplier.fromBasisPoints(180);
    const crashPoint = Multiplier.fromBasisPoints(200);

    expect(current.isLessThanOrEqual(crashPoint)).toBe(true);
    expect(current.isGreaterThan(crashPoint)).toBe(false);
  });
});
