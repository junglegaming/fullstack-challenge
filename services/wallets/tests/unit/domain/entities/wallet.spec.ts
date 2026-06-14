import { describe, expect, it } from "bun:test";
import { Wallet } from "../../../../src/domain/entities/wallet";
import { InsufficientBalanceError } from "../../../../src/domain/errors/insufficient-balance.error";
import { InvalidMoneyAmountError } from "../../../../src/domain/errors/invalid-money-amount.error";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { WalletId } from "../../../../src/domain/value-objects/wallet-id";
import { WalletTransactionType } from "../../../../src/domain/value-objects/wallet-transaction-type";

describe("Wallet", () => {
  it("creates wallet with non-negative initial balance", () => {
    const wallet = Wallet.create({
      playerId: PlayerId.create("player-1"),
      initialBalance: Money.fromCents(100000n),
    });

    expect(wallet.balance.amountInCents).toBe(100000n);
    expect(wallet.playerId.toString()).toBe("player-1");
  });

  it("rejects negative initial balance", () => {
    expect(() =>
      Wallet.create({
        playerId: PlayerId.create("player-1"),
        initialBalance: Money.fromCents(-1n),
      }),
    ).toThrow(InvalidMoneyAmountError);
  });

  it("reconstitutes wallet from persistence data", () => {
    const wallet = Wallet.reconstitute({
      id: WalletId.create("wallet-1"),
      playerId: PlayerId.create("player-1"),
      balance: Money.fromCents(2500n),
    });

    expect(wallet.id.toString()).toBe("wallet-1");
    expect(wallet.balance.toDisplayString()).toBe("25.00");
  });

  it("rejects negative stored balance on reconstitute", () => {
    expect(() =>
      Wallet.reconstitute({
        id: WalletId.create("wallet-1"),
        playerId: PlayerId.create("player-1"),
        balance: Money.fromCents(-1n),
      }),
    ).toThrow(InvalidMoneyAmountError);
  });

  it("credits balance without using floating point", () => {
    const wallet = Wallet.create({
      playerId: PlayerId.create("player-1"),
      initialBalance: Money.fromCents(1000n),
    });

    const result = wallet.credit(Money.fromCents(250n), "credit-key");

    expect(result.wallet.balance.amountInCents).toBe(1250n);
    expect(result.transaction.type).toBe(WalletTransactionType.CREDIT);
  });

  it("debits balance when funds are available", () => {
    const wallet = Wallet.create({
      playerId: PlayerId.create("player-1"),
      initialBalance: Money.fromCents(1000n),
    });

    const result = wallet.debit(Money.fromCents(400n), "debit-key");

    expect(result.wallet.balance.amountInCents).toBe(600n);
    expect(result.transaction.type).toBe(WalletTransactionType.DEBIT);
  });

  it("rejects debit that would make balance negative", () => {
    const wallet = Wallet.create({
      playerId: PlayerId.create("player-1"),
      initialBalance: Money.fromCents(100n),
    });

    expect(() => wallet.debit(Money.fromCents(101n), "debit-key")).toThrow(
      InsufficientBalanceError,
    );
  });
});
