import { beforeEach, describe, expect, it } from "bun:test";
import { InternalCreditWalletUseCase } from "../../../../src/application/use-cases/internal-credit-wallet.use-case";
import { CreateWalletUseCase } from "../../../../src/application/use-cases/create-wallet.use-case";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { WalletTransactionType } from "../../../../src/domain/value-objects/wallet-transaction-type";
import { InMemoryWalletRepository } from "../../../support/in-memory-wallet.repository";

describe("InternalCreditWalletUseCase", () => {
  let repository: InMemoryWalletRepository;
  let createWalletUseCase: CreateWalletUseCase;
  let creditWalletUseCase: InternalCreditWalletUseCase;
  const playerId = PlayerId.create("player-1");

  beforeEach(async () => {
    repository = new InMemoryWalletRepository();
    createWalletUseCase = new CreateWalletUseCase(repository, Money.fromCents(1000n));
    creditWalletUseCase = new InternalCreditWalletUseCase(repository);
    await createWalletUseCase.execute(playerId);
  });

  it("credits wallet balance internally", async () => {
    const result = await creditWalletUseCase.execute({
      playerId,
      amount: Money.fromCents(500n),
      idempotencyKey: "credit-1",
      messageType: "wallet.credit.requested",
    });

    expect(result.isReplay).toBe(false);
    expect(result.wallet.balance.amountInCents).toBe(1500n);
    expect(result.transaction.type).toBe(WalletTransactionType.CREDIT);
    expect(result.transaction.amount.amountInCents).toBe(500n);
  });

  it("returns replay result for duplicate message without mutating balance twice", async () => {
    const input = {
      playerId,
      amount: Money.fromCents(500n),
      idempotencyKey: "credit-duplicate",
      messageType: "wallet.credit.requested",
    };

    const first = await creditWalletUseCase.execute(input);
    const second = await creditWalletUseCase.execute(input);

    expect(first.isReplay).toBe(false);
    expect(second.isReplay).toBe(true);
    expect(second.transaction.id).toBe(first.transaction.id);
    expect(second.wallet.balance.amountInCents).toBe(1500n);

    const storedWallet = await repository.findByPlayerId(playerId);
    expect(storedWallet?.balance.amountInCents).toBe(1500n);
  });
});
