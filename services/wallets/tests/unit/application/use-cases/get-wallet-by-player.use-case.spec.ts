import { beforeEach, describe, expect, it } from "bun:test";
import { GetWalletByPlayerUseCase } from "../../../../src/application/use-cases/get-wallet-by-player.use-case";
import { Wallet } from "../../../../src/domain/entities/wallet";
import { WalletNotFoundError } from "../../../../src/domain/errors/wallet-not-found.error";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { InMemoryWalletRepository } from "../../../support/in-memory-wallet.repository";

describe("GetWalletByPlayerUseCase", () => {
  let repository: InMemoryWalletRepository;
  let useCase: GetWalletByPlayerUseCase;
  const playerId = PlayerId.create("player-1");

  beforeEach(() => {
    repository = new InMemoryWalletRepository();
    useCase = new GetWalletByPlayerUseCase(repository);
  });

  it("returns wallet for existing player", async () => {
    const wallet = Wallet.create({
      playerId,
      initialBalance: Money.fromCents(50000n),
    });
    await repository.save(wallet);

    const result = await useCase.execute(playerId);

    expect(result.wallet.balance.amountInCents).toBe(50000n);
    expect(result.wallet.playerId.toString()).toBe("player-1");
  });

  it("throws when wallet does not exist", async () => {
    await expect(useCase.execute(playerId)).rejects.toThrow(WalletNotFoundError);
  });
});
