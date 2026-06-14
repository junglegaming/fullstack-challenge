import { describe, expect, it } from "bun:test";
import { InvalidMoneyAmountError } from "../../../../src/domain/errors/invalid-money-amount.error";
import { Money } from "../../../../src/domain/value-objects/money";

describe("Money", () => {
  it("creates money from bigint cents", () => {
    const money = Money.fromCents(150n);

    expect(money.amountInCents).toBe(150n);
    expect(money.toDisplayString()).toBe("1.50");
  });

  it("creates money from cents string", () => {
    const money = Money.fromCentsString("100000");

    expect(money.amountInCents).toBe(100000n);
    expect(money.toDisplayString()).toBe("1000.00");
  });

  it("rejects negative cents", () => {
    expect(() => Money.fromCents(-1n)).toThrow(InvalidMoneyAmountError);
  });

  it("rejects invalid cents string", () => {
    expect(() => Money.fromCentsString("10.5")).toThrow(InvalidMoneyAmountError);
  });

  it("adds amounts without using floating point", () => {
    const result = Money.fromCents(100n).add(Money.fromCents(250n));

    expect(result.amountInCents).toBe(350n);
  });

  it("subtracts amounts and prevents negative balance", () => {
    const walletBalance = Money.fromCents(500n);
    const bet = Money.fromCents(200n);

    expect(walletBalance.subtract(bet).amountInCents).toBe(300n);
    expect(() => walletBalance.subtract(Money.fromCents(501n))).toThrow(
      InvalidMoneyAmountError,
    );
  });

  it("compares amounts", () => {
    const lower = Money.fromCents(100n);
    const higher = Money.fromCents(200n);

    expect(higher.isGreaterThanOrEqual(lower)).toBe(true);
    expect(lower.isGreaterThanOrEqual(higher)).toBe(false);
  });
});
