import { describe, expect, it } from "bun:test";
import { Multiplier } from "../../src/domain/value-objects/multiplier.vo";

describe("Multiplier", () => {
  it("quantizes a float curve value down to 2 decimals", () => {
    expect(Multiplier.fromValue(2.3749).toHundredths()).toBe(237);
    expect(Multiplier.fromValue(1.999).toHundredths()).toBe(199);
  });

  it("never goes below 1.00x", () => {
    expect(Multiplier.fromValue(0.5).toHundredths()).toBe(100);
    expect(Multiplier.fromHundredths(50).toHundredths()).toBe(100);
  });

  it("computes integer payouts, flooring fractional cents", () => {

    expect(Multiplier.fromHundredths(237).payoutCents(1000n)).toBe(2370n);

    expect(Multiplier.fromHundredths(150).payoutCents(333n)).toBe(499n);
  });

  it("formats nicely", () => {
    expect(Multiplier.fromHundredths(237).toString()).toBe("2.37x");
  });
});
