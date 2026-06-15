import { beforeEach, describe, expect, it } from "bun:test";
import { CreateWalletUseCase } from "../../../../src/application/use-cases/create-wallet.use-case";
import { HandleWalletCreditRequestedUseCase } from "../../../../src/application/use-cases/handle-wallet-credit-requested.use-case";
import { InternalCreditWalletUseCase } from "../../../../src/application/use-cases/internal-credit-wallet.use-case";
import type { WalletEventPublisher } from "../../../../src/application/ports/wallet-event.publisher";
import {
  WALLET_CREDIT_REQUESTED,
  type WalletCreditFailedEnvelope,
  type WalletCreditSucceededEnvelope,
  type WalletDebitFailedEnvelope,
  type WalletDebitSucceededEnvelope,
} from "../../../../src/application/messaging/wallet-events";
import { Money } from "../../../../src/domain/value-objects/money";
import { PlayerId } from "../../../../src/domain/value-objects/player-id";
import { InMemoryWalletRepository } from "../../../support/in-memory-wallet.repository";

describe("HandleWalletCreditRequestedUseCase", () => {
  class FakeWalletEventPublisher implements WalletEventPublisher {
    readonly creditSucceeded: WalletCreditSucceededEnvelope[] = [];
    readonly creditFailed: WalletCreditFailedEnvelope[] = [];

    async publishDebitSucceeded(
      _envelope: WalletDebitSucceededEnvelope,
    ): Promise<void> {}

    async publishDebitFailed(_envelope: WalletDebitFailedEnvelope): Promise<void> {}

    async publishCreditSucceeded(
      envelope: WalletCreditSucceededEnvelope,
    ): Promise<void> {
      this.creditSucceeded.push(envelope);
    }

    async publishCreditFailed(
      envelope: WalletCreditFailedEnvelope,
    ): Promise<void> {
      this.creditFailed.push(envelope);
    }
  }

  let repository: InMemoryWalletRepository;
  let publisher: FakeWalletEventPublisher;
  let useCase: HandleWalletCreditRequestedUseCase;
  const playerId = PlayerId.create("player-1");

  beforeEach(async () => {
    repository = new InMemoryWalletRepository();
    publisher = new FakeWalletEventPublisher();
    await new CreateWalletUseCase(repository, Money.fromCents(1000n)).execute(
      playerId,
    );
    useCase = new HandleWalletCreditRequestedUseCase(
      new InternalCreditWalletUseCase(repository),
      publisher,
    );
  });

  it("publishes wallet.credit.succeeded after crediting payout", async () => {
    await useCase.execute(createCreditRequestedEnvelope("credit-1", "500"));

    const wallet = await repository.findByPlayerId(playerId);
    expect(wallet?.balance.amountInCents).toBe(1500n);
    expect(publisher.creditSucceeded).toHaveLength(1);
    expect(publisher.creditSucceeded[0]?.payload.balanceAfterCents).toBe("1500");
    expect(publisher.creditFailed).toHaveLength(0);
  });

  it("publishes wallet.credit.failed when wallet does not exist", async () => {
    await useCase.execute({
      ...createCreditRequestedEnvelope("credit-missing-wallet", "500"),
      payload: {
        ...createCreditRequestedEnvelope("credit-missing-wallet", "500").payload,
        playerId: "missing-player",
      },
    });

    expect(publisher.creditFailed).toHaveLength(1);
    expect(publisher.creditFailed[0]?.payload.reason).toBe("WALLET_NOT_FOUND");
    expect(publisher.creditSucceeded).toHaveLength(0);
  });

  it("handles duplicate credit request without crediting twice", async () => {
    const envelope = createCreditRequestedEnvelope("credit-duplicate", "300");

    await useCase.execute(envelope);
    await useCase.execute(envelope);

    const wallet = await repository.findByPlayerId(playerId);
    expect(wallet?.balance.amountInCents).toBe(1300n);
    expect(publisher.creditSucceeded).toHaveLength(2);
    expect(publisher.creditSucceeded[1]?.payload.balanceAfterCents).toBe("1300");
  });

  function createCreditRequestedEnvelope(
    idempotencyKey: string,
    amountCents: string,
  ) {
    return {
      messageId: `message-${idempotencyKey}`,
      type: WALLET_CREDIT_REQUESTED,
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
        reason: "BET_CASHOUT" as const,
      },
    };
  }
});
