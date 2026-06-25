import { beforeEach, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import type { ConfigService } from "@nestjs/config";
import { CreditWalletUseCase } from "../../src/application/use-cases/credit-wallet.use-case";
import { DebitWalletUseCase } from "../../src/application/use-cases/debit-wallet.use-case";
import { GetOrCreateWalletUseCase } from "../../src/application/use-cases/get-or-create-wallet.use-case";
import { InMemoryWalletRepository } from "./support/in-memory-wallet.repository";

describe("Wallet saga (e2e)", () => {
  let repo: InMemoryWalletRepository;
  let getOrCreate: GetOrCreateWalletUseCase;
  let debit: DebitWalletUseCase;
  let credit: CreditWalletUseCase;

  const ids = { generate: () => randomUUID() };
  const config = {
    get: (_key: string, fallback: string) => fallback,
  } as unknown as ConfigService;

  beforeEach(() => {
    repo = new InMemoryWalletRepository();
    getOrCreate = new GetOrCreateWalletUseCase(
      repo,
      ids,

      { get: (_k: string, _d: string) => "1000000" } as unknown as ConfigService,
    );
    debit = new DebitWalletUseCase(repo, ids, getOrCreate);
    credit = new CreditWalletUseCase(repo, ids, getOrCreate);
  });

  it("auto-provisions a wallet with the starting balance", async () => {
    const wallet = await getOrCreate.execute("player-1");
    expect(wallet.getBalance().toCents()).toBe(1_000_000n);
  });

  it("debits a bet and updates the balance", async () => {
    const result = await debit.execute({
      playerId: "player-1",
      amountCents: "1000",
      reference: "debit:bet-1",
    });
    expect(result.status).toBe("SUCCEEDED");
    const wallet = await getOrCreate.execute("player-1");
    expect(wallet.getBalance().toCents()).toBe(999_000n);
  });

  it("is idempotent: a redelivered debit does not double-charge", async () => {
    const command = {
      playerId: "player-1",
      amountCents: "1000",
      reference: "debit:bet-1",
    };
    await debit.execute(command);
    await debit.execute(command);
    const wallet = await getOrCreate.execute("player-1");
    expect(wallet.getBalance().toCents()).toBe(999_000n);
  });

  it("rejects a debit with insufficient funds and leaves the balance intact", async () => {
    const result = await debit.execute({
      playerId: "player-1",
      amountCents: "2000000",
      reference: "debit:bet-big",
    });
    expect(result.status).toBe("FAILED");
    if (result.status === "FAILED") {
      expect(result.reason).toBe("INSUFFICIENT_FUNDS");
    }
    const wallet = await getOrCreate.execute("player-1");
    expect(wallet.getBalance().toCents()).toBe(1_000_000n);
  });

  it("credits a cash-out payout", async () => {
    await debit.execute({
      playerId: "player-1",
      amountCents: "1000",
      reference: "debit:bet-1",
    });
    const result = await credit.execute({
      playerId: "player-1",
      amountCents: "2370",
      reference: "credit:bet-1",
    });
    expect(result.status).toBe("SUCCEEDED");
    const wallet = await getOrCreate.execute("player-1");
    expect(wallet.getBalance().toCents()).toBe(1_001_370n);
  });

  it("is idempotent on credit", async () => {
    const command = {
      playerId: "player-1",
      amountCents: "2370",
      reference: "credit:bet-1",
    };
    await credit.execute(command);
    await credit.execute(command);
    const wallet = await getOrCreate.execute("player-1");
    expect(wallet.getBalance().toCents()).toBe(1_002_370n);
  });
});
