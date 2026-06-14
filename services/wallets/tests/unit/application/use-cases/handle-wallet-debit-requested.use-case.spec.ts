import { beforeEach, describe, expect, it } from "bun:test";
import { CreateWalletUseCase } from "../../../../src/application/use-cases/create-wallet.use-case";
import { HandleWalletDebitRequestedUseCase } from "../../../../src/application/use-cases/handle-wallet-debit-requested.use-case";
import { InternalDebitWalletUseCase } from "../../../../src/application/use-cases/internal-debit-wallet.use-case";
import type { WalletEventPublisher } from "../../../../src/application/ports/wallet-event.publisher";
import {
  WALLET_DEBIT_REQUESTED,
  type WalletDebitFailedEnvelope,
  type WalletDebitSucceededEnvelope,
} from "../../../../src/application/messaging/wallet-events";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { InMemoryWalletRepository } from "../../../support/in-memory-wallet.repository";

describe("HandleWalletDebitRequestedUseCase", () => {
  class FakeWalletEventPublisher implements WalletEventPublisher {
    readonly succeeded: WalletDebitSucceededEnvelope[] = [];
    readonly failed: WalletDebitFailedEnvelope[] = [];

    async publishDebitSucceeded(
      envelope: WalletDebitSucceededEnvelope,
    ): Promise<void> {
      this.succeeded.push(envelope);
    }

    async publishDebitFailed(envelope: WalletDebitFailedEnvelope): Promise<void> {
      this.failed.push(envelope);
    }
  }

  let repository: InMemoryWalletRepository;
  let publisher: FakeWalletEventPublisher;
  let useCase: HandleWalletDebitRequestedUseCase;
  const playerId = PlayerId.create("player-1");

  beforeEach(async () => {
    repository = new InMemoryWalletRepository();
    publisher = new FakeWalletEventPublisher();
    await new CreateWalletUseCase(repository, Money.fromCents(1000n)).execute(
      playerId,
    );
    useCase = new HandleWalletDebitRequestedUseCase(
      new InternalDebitWalletUseCase(repository),
      publisher,
    );
  });

  it("publishes wallet.debit.succeeded after debit", async () => {
    await useCase.execute(createDebitRequestedEnvelope("debit-1", "400"));

    const wallet = await repository.findByPlayerId(playerId);
    expect(wallet?.balance.amountInCents).toBe(600n);
    expect(publisher.succeeded).toHaveLength(1);
    expect(publisher.succeeded[0]?.payload.balanceAfterCents).toBe("600");
    expect(publisher.failed).toHaveLength(0);
  });

  it("publishes wallet.debit.failed when balance is insufficient", async () => {
    await useCase.execute(createDebitRequestedEnvelope("debit-insufficient", "1500"));

    const wallet = await repository.findByPlayerId(playerId);
    expect(wallet?.balance.amountInCents).toBe(1000n);
    expect(publisher.failed).toHaveLength(1);
    expect(publisher.failed[0]?.payload.reason).toBe("INSUFFICIENT_BALANCE");
    expect(publisher.succeeded).toHaveLength(0);
  });

  it("handles duplicate debit request without debiting twice", async () => {
    const envelope = createDebitRequestedEnvelope("debit-duplicate", "300");

    await useCase.execute(envelope);
    await useCase.execute(envelope);

    const wallet = await repository.findByPlayerId(playerId);
    expect(wallet?.balance.amountInCents).toBe(700n);
    expect(publisher.succeeded).toHaveLength(2);
    expect(publisher.succeeded[1]?.payload.balanceAfterCents).toBe("700");
  });

  function createDebitRequestedEnvelope(
    idempotencyKey: string,
    amountCents: string,
  ) {
    return {
      messageId: `message-${idempotencyKey}`,
      type: WALLET_DEBIT_REQUESTED,
      version: 1,
      correlationId: `correlation-${idempotencyKey}`,
      causationId: null,
      idempotencyKey,
      occurredAt: new Date().toISOString(),
      producer: "games-service",
      payload: {
        playerId: playerId.toString(),
        roundId: "round-1",
        betId: "bet-1",
        amountCents,
        reason: "BET_PLACED" as const,
      },
    };
  }
});
