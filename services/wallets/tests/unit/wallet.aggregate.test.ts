import { describe, expect, it } from "bun:test";
import { Wallet } from "../../src/domain/entities/wallet.aggregate";
import { Money } from "../../src/domain/value-objects/money.vo";
import {
  InsufficientFundsError,
  NonPositiveAmountError,
} from "../../src/domain/errors/wallet.errors";

const now = new Date("2026-01-01T00:00:00Z");

function makeWallet(initialCents: bigint): Wallet {
  return Wallet.create({
    id: "wallet-1",
    playerId: "player-1",
    initialBalance: Money.fromCents(initialCents),
    now,
  });
}

describe("Wallet aggregate", () => {
  it("credits increase the balance and produce a ledger entry", () => {
    const wallet = makeWallet(1000n);
    const tx = wallet.credit(Money.fromCents(500n), "credit:bet-1", {
      transactionId: "tx-1",
      now,
    });
    expect(wallet.getBalance().toCents()).toBe(1500n);
    expect(tx.type).toBe("CREDIT");
    expect(tx.balanceAfter.toCents()).toBe(1500n);
    expect(tx.reference).toBe("credit:bet-1");
  });

  it("debits decrease the balance when funds are sufficient", () => {
    const wallet = makeWallet(1000n);
    const tx = wallet.debit(Money.fromCents(400n), "debit:bet-1", {
      transactionId: "tx-2",
      now,
    });
    expect(wallet.getBalance().toCents()).toBe(600n);
    expect(tx.type).toBe("DEBIT");
    expect(tx.balanceAfter.toCents()).toBe(600n);
  });

  it("rejects a debit that would overdraw the wallet", () => {
    const wallet = makeWallet(300n);
    expect(() =>
      wallet.debit(Money.fromCents(400n), "debit:bet-1", {
        transactionId: "tx-3",
        now,
      }),
    ).toThrow(InsufficientFundsError);

    expect(wallet.getBalance().toCents()).toBe(300n);
  });

  it("never lets the balance go negative even at the exact boundary", () => {
    const wallet = makeWallet(500n);
    wallet.debit(Money.fromCents(500n), "debit:bet-1", {
      transactionId: "tx-4",
      now,
    });
    expect(wallet.getBalance().toCents()).toBe(0n);
    expect(wallet.getBalance().isNegative()).toBe(false);
  });

  it("rejects non-positive credit/debit amounts", () => {
    const wallet = makeWallet(500n);
    expect(() =>
      wallet.debit(Money.zero(), "x", { transactionId: "t", now }),
    ).toThrow(NonPositiveAmountError);
    expect(() =>
      wallet.credit(Money.fromCents(-1n), "x", { transactionId: "t", now }),
    ).toThrow(NonPositiveAmountError);
  });
});
