import { beforeEach, describe, expect, it } from "bun:test";
import { WalletRepository } from "../../../../src/application/ports/wallet.repository";
import { CreateWalletUseCase } from "../../../../src/application/use-cases/create-wallet.use-case";
import { Wallet } from "../../../../src/domain/entities/wallet";
import { WalletAlreadyExistsError } from "../../../../src/domain/errors/wallet-already-exists.error";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";

class InMemoryWalletRepository implements WalletRepository {
  private wallets = new Map<string, Wallet>();

  async findByPlayerId(playerId: PlayerId): Promise<Wallet | null> {
    return this.wallets.get(playerId.toString()) ?? null;
  }

  async save(wallet: Wallet): Promise<void> {
    this.wallets.set(wallet.playerId.toString(), wallet);
  }
}

describe("CreateWalletUseCase", () => {
  let repository: InMemoryWalletRepository;
  let useCase: CreateWalletUseCase;
  const playerId = PlayerId.create("player-1");
  const initialBalance = Money.fromCents(100000n);

  beforeEach(() => {
    repository = new InMemoryWalletRepository();
    useCase = new CreateWalletUseCase(repository, initialBalance);
  });

  it("creates wallet with configured initial balance", async () => {
    const result = await useCase.execute(playerId);

    expect(result.wallet.playerId.toString()).toBe("player-1");
    expect(result.wallet.balance.amountInCents).toBe(100000n);
    expect(result.wallet.balance.toDisplayString()).toBe("1000.00");
  });

  it("persists created wallet", async () => {
    await useCase.execute(playerId);

    const storedWallet = await repository.findByPlayerId(playerId);

    expect(storedWallet?.balance.amountInCents).toBe(100000n);
  });

  it("rejects duplicate wallet for same player", async () => {
    await useCase.execute(playerId);

    await expect(useCase.execute(playerId)).rejects.toThrow(
      WalletAlreadyExistsError,
    );
  });
});
