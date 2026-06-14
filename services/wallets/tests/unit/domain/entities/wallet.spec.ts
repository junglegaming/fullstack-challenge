import { describe, expect, it } from "bun:test";
import { Wallet } from "../../../../src/domain/entities/wallet";
import { InvalidMoneyAmountError } from "../../../../src/domain/errors/invalid-money-amount.error";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { WalletId } from "../../../../src/domain/value-objects/wallet-id";

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
});
