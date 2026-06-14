import { beforeEach, describe, expect, it } from "bun:test";
import { CreateWalletUseCase } from "../../../../src/application/use-cases/create-wallet.use-case";
import { InternalDebitWalletUseCase } from "../../../../src/application/use-cases/internal-debit-wallet.use-case";
import { InsufficientBalanceError } from "../../../../src/domain/errors/insufficient-balance.error";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { WalletTransactionType } from "../../../../src/domain/value-objects/wallet-transaction-type";
import { InMemoryWalletRepository } from "../../../support/in-memory-wallet.repository";

describe("InternalDebitWalletUseCase", () => {
  let repository: InMemoryWalletRepository;
  let createWalletUseCase: CreateWalletUseCase;
  let debitWalletUseCase: InternalDebitWalletUseCase;
  const playerId = PlayerId.create("player-1");

  beforeEach(async () => {
    repository = new InMemoryWalletRepository();
    createWalletUseCase = new CreateWalletUseCase(repository, Money.fromCents(1000n));
    debitWalletUseCase = new InternalDebitWalletUseCase(repository);
    await createWalletUseCase.execute(playerId);
  });

  it("debits wallet balance internally", async () => {
    const result = await debitWalletUseCase.execute({
      playerId,
      amount: Money.fromCents(400n),
      idempotencyKey: "debit-1",
      messageType: "wallet.debit.requested",
    });

    expect(result.isReplay).toBe(false);
    expect(result.wallet.balance.amountInCents).toBe(600n);
    expect(result.transaction.type).toBe(WalletTransactionType.DEBIT);
    expect(result.transaction.balanceAfter.amountInCents).toBe(600n);
  });

  it("rejects debit when balance is insufficient", async () => {
    await expect(
      debitWalletUseCase.execute({
        playerId,
        amount: Money.fromCents(1500n),
        idempotencyKey: "debit-insufficient",
        messageType: "wallet.debit.requested",
      }),
    ).rejects.toThrow(InsufficientBalanceError);

    const storedWallet = await repository.findByPlayerId(playerId);
    expect(storedWallet?.balance.amountInCents).toBe(1000n);
  });

  it("returns replay result for duplicate message without debiting twice", async () => {
    const input = {
      playerId,
      amount: Money.fromCents(300n),
      idempotencyKey: "debit-duplicate",
      messageType: "wallet.debit.requested",
    };

    const first = await debitWalletUseCase.execute(input);
    const second = await debitWalletUseCase.execute(input);

    expect(first.isReplay).toBe(false);
    expect(second.isReplay).toBe(true);
    expect(second.transaction.id).toBe(first.transaction.id);
    expect(second.wallet.balance.amountInCents).toBe(700n);

    const storedWallet = await repository.findByPlayerId(playerId);
    expect(storedWallet?.balance.amountInCents).toBe(700n);
  });
});
