import { describe, expect, it } from "bun:test";
import { CashOutBetUseCase } from "../../../../src/application/use-cases/cash-out-bet.use-case";
import { HandleWalletCreditFailedUseCase } from "../../../../src/application/use-cases/handle-wallet-credit-failed.use-case";
import { HandleWalletCreditSucceededUseCase } from "../../../../src/application/use-cases/handle-wallet-credit-succeeded.use-case";
import { HandleWalletDebitSucceededUseCase } from "../../../../src/application/use-cases/handle-wallet-debit-succeeded.use-case";
import { PlaceBetUseCase } from "../../../../src/application/use-cases/place-bet.use-case";
import type { GameRealtimePublisher } from "../../../../src/application/ports/game-realtime.publisher";
import type { WalletCommandPublisher } from "../../../../src/application/ports/wallet-command.publisher";
import type {
  WalletCreditRequestedEnvelope,
  WalletDebitRequestedEnvelope,
} from "../../../../src/application/messaging/wallet-events";
import {
  WALLET_CREDIT_FAILED,
  WALLET_CREDIT_SUCCEEDED,
  WALLET_DEBIT_SUCCEEDED,
} from "../../../../src/application/messaging/wallet-events";
import { InMemoryGameRoundsRepository } from "../../../../src/infrastructure/persistence/in-memory-game-rounds.repository";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";
import { PayoutSettlementStatus } from "../../../../src/domain/value-objects/payout-settlement-status";

describe("HandleWalletCreditResultUseCases", () => {
  class FakeRealtimePublisher implements GameRealtimePublisher {
    async publishRoundBettingStarted(): Promise<void> {}

    async publishRoundStarted(): Promise<void> {}

    async publishRoundMultiplierTick(): Promise<void> {}

    async publishBetAccepted(): Promise<void> {}

    async publishBetCashedOut(): Promise<void> {}

    async publishRoundCrashed(): Promise<void> {}

    async publishRoundSettled(): Promise<void> {}
  }

  class FakeWalletCommandPublisher implements WalletCommandPublisher {
    readonly debitRequests: WalletDebitRequestedEnvelope[] = [];
    readonly creditRequests: WalletCreditRequestedEnvelope[] = [];

    async publishDebitRequested(
      envelope: WalletDebitRequestedEnvelope,
    ): Promise<void> {
      this.debitRequests.push(envelope);
    }

    async publishCreditRequested(
      envelope: WalletCreditRequestedEnvelope,
    ): Promise<void> {
      this.creditRequests.push(envelope);
    }
  }

  async function createCashedOutBet() {
    const provablyFairService = new ProvablyFairService();
    const repository = new InMemoryGameRoundsRepository(provablyFairService);
    const walletCommandPublisher = new FakeWalletCommandPublisher();
    const realtimePublisher = new FakeRealtimePublisher();

    await new PlaceBetUseCase(repository, walletCommandPublisher).execute({
      playerId: "player-1",
      body: { amountCents: "1000" },
    });

    const debitRequest = walletCommandPublisher.debitRequests[0];

    await new HandleWalletDebitSucceededUseCase(
      repository,
      realtimePublisher,
    ).execute({
      messageId: "wallet-debit-result-1",
      type: WALLET_DEBIT_SUCCEEDED,
      version: 1,
      correlationId: debitRequest?.correlationId ?? "correlation-1",
      causationId: debitRequest?.messageId ?? null,
      idempotencyKey: debitRequest?.idempotencyKey ?? "debit-1",
      occurredAt: new Date().toISOString(),
      producer: "wallets-service",
      payload: {
        playerId: "player-1",
        walletId: "wallet-1",
        roundId: debitRequest?.payload.roundId ?? "",
        betId: debitRequest?.payload.betId ?? "",
        amountCents: "1000",
        balanceAfterCents: "99000",
      },
    });

    const currentRound = await repository.findCurrent();
    currentRound.start(new Date("2026-06-14T12:00:11.000Z"));

    await new CashOutBetUseCase(
      repository,
      walletCommandPublisher,
      { multiplierGrowth: { growthBasisPointsPerSecond: 0 } },
      realtimePublisher,
    ).execute({ playerId: "player-1" });

    const creditRequest = walletCommandPublisher.creditRequests[0];

    return { repository, creditRequest };
  }

  function buildCreditSucceededEnvelope(
    creditRequest: WalletCreditRequestedEnvelope | undefined,
  ) {
    return {
      messageId: "wallet-credit-result-1",
      type: WALLET_CREDIT_SUCCEEDED,
      version: 1,
      correlationId: creditRequest?.correlationId ?? "correlation-1",
      causationId: creditRequest?.messageId ?? null,
      idempotencyKey: creditRequest?.idempotencyKey ?? "credit-1",
      occurredAt: new Date().toISOString(),
      producer: "wallets-service",
      payload: {
        playerId: "player-1",
        walletId: "wallet-1",
        roundId: creditRequest?.payload.roundId ?? "",
        betId: creditRequest?.payload.betId ?? "",
        amountCents: creditRequest?.payload.amountCents ?? "1000",
        balanceAfterCents: "100000",
      },
    };
  }

  function buildCreditFailedEnvelope(
    creditRequest: WalletCreditRequestedEnvelope | undefined,
    reason = "WALLET_NOT_FOUND",
  ) {
    return {
      messageId: "wallet-credit-result-1",
      type: WALLET_CREDIT_FAILED,
      version: 1,
      correlationId: creditRequest?.correlationId ?? "correlation-1",
      causationId: creditRequest?.messageId ?? null,
      idempotencyKey: creditRequest?.idempotencyKey ?? "credit-1",
      occurredAt: new Date().toISOString(),
      producer: "wallets-service",
      payload: {
        playerId: "player-1",
        roundId: creditRequest?.payload.roundId ?? "",
        betId: creditRequest?.payload.betId ?? "",
        amountCents: creditRequest?.payload.amountCents ?? "1000",
        reason,
      },
    };
  }

  it("marks payout as settled when wallet credit succeeds", async () => {
    const { repository, creditRequest } = await createCashedOutBet();
    const useCase = new HandleWalletCreditSucceededUseCase(repository);

    await useCase.execute(buildCreditSucceededEnvelope(creditRequest));

    const round = await repository.findById(
      (await repository.findCurrent()).id,
    );
    const bet = round?.bets[0];

    expect(bet?.payoutSettlementStatus).toBe(PayoutSettlementStatus.SETTLED);
    expect(bet?.payoutSettlementFailureReason).toBeNull();
  });

  it("ignores duplicate wallet.credit.succeeded events", async () => {
    const { repository, creditRequest } = await createCashedOutBet();
    const useCase = new HandleWalletCreditSucceededUseCase(repository);
    const envelope = buildCreditSucceededEnvelope(creditRequest);

    await useCase.execute(envelope);
    await useCase.execute({
      ...envelope,
      messageId: "wallet-credit-result-duplicate",
    });

    const round = await repository.findById(
      (await repository.findCurrent()).id,
    );
    const bet = round?.bets[0];

    expect(bet?.payoutSettlementStatus).toBe(PayoutSettlementStatus.SETTLED);
  });

  it("marks payout settlement failure when wallet credit fails", async () => {
    const { repository, creditRequest } = await createCashedOutBet();
    const useCase = new HandleWalletCreditFailedUseCase(repository);

    await useCase.execute(
      buildCreditFailedEnvelope(creditRequest, "WALLET_NOT_FOUND"),
    );

    const round = await repository.findById(
      (await repository.findCurrent()).id,
    );
    const bet = round?.bets[0];

    expect(bet?.payoutSettlementStatus).toBe(PayoutSettlementStatus.FAILED);
    expect(bet?.payoutSettlementFailureReason).toBe("WALLET_NOT_FOUND");
  });

  it("ignores duplicate wallet.credit.failed events", async () => {
    const { repository, creditRequest } = await createCashedOutBet();
    const useCase = new HandleWalletCreditFailedUseCase(repository);
    const envelope = buildCreditFailedEnvelope(creditRequest, "WALLET_NOT_FOUND");

    await useCase.execute(envelope);
    await useCase.execute({
      ...envelope,
      messageId: "wallet-credit-failed-duplicate",
    });

    const round = await repository.findById(
      (await repository.findCurrent()).id,
    );
    const bet = round?.bets[0];

    expect(bet?.payoutSettlementStatus).toBe(PayoutSettlementStatus.FAILED);
    expect(bet?.payoutSettlementFailureReason).toBe("WALLET_NOT_FOUND");
  });
});
