import { describe, expect, it } from "bun:test";
import { ProcessedMessage } from "../../../../src/domain/entities/processed-message";
import { WalletTransaction } from "../../../../src/domain/entities/wallet-transaction";
import { Wallet } from "../../../../src/domain/entities/wallet";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { WalletTransactionType } from "../../../../src/domain/value-objects/wallet-transaction-type";

describe("WalletTransaction", () => {
  it("creates credit transaction with bigint amount", () => {
    const wallet = Wallet.create({
      playerId: PlayerId.create("player-1"),
      initialBalance: Money.fromCents(1000n),
    });

    const mutation = wallet.credit(Money.fromCents(500n), "idem-1");

    expect(mutation.transaction.amount.amountInCents).toBe(500n);
    expect(mutation.transaction.balanceAfter.amountInCents).toBe(1500n);
    expect(mutation.transaction.idempotencyKey).toBe("idem-1");
  });

  it("reconstitutes transaction from persistence data", () => {
    const walletId = Wallet.create({
      playerId: PlayerId.create("player-1"),
      initialBalance: Money.zero(),
    }).id;

    const transaction = WalletTransaction.reconstitute({
      id: "tx-1",
      walletId,
      type: WalletTransactionType.DEBIT,
      amount: Money.fromCents(100n),
      balanceAfter: Money.fromCents(900n),
      idempotencyKey: "idem-2",
    });

    expect(transaction.type).toBe(WalletTransactionType.DEBIT);
    expect(transaction.amount.amountInCents).toBe(100n);
  });
});

describe("ProcessedMessage", () => {
  it("tracks processed broker message idempotency key", () => {
    const message = ProcessedMessage.create({
      idempotencyKey: "msg-1",
      messageType: "wallet.debit.requested",
      walletTransactionId: "tx-1",
    });

    expect(message.idempotencyKey).toBe("msg-1");
    expect(message.messageType).toBe("wallet.debit.requested");
    expect(message.walletTransactionId).toBe("tx-1");
  });
});
