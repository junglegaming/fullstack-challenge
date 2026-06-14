import { describe, expect, it } from "bun:test";
import { GetCurrentRoundUseCase } from "../../../../src/application/use-cases/get-current-round.use-case";
import { GetPlayerBetsUseCase } from "../../../../src/application/use-cases/get-player-bets.use-case";
import { GetRoundHistoryUseCase } from "../../../../src/application/use-cases/get-round-history.use-case";
import { GetRoundVerificationUseCase } from "../../../../src/application/use-cases/get-round-verification.use-case";
import { PlaceBetUseCase } from "../../../../src/application/use-cases/place-bet.use-case";
import { CashOutBetUseCase } from "../../../../src/application/use-cases/cash-out-bet.use-case";
import { HandleWalletDebitFailedUseCase } from "../../../../src/application/use-cases/handle-wallet-debit-failed.use-case";
import { HandleWalletDebitSucceededUseCase } from "../../../../src/application/use-cases/handle-wallet-debit-succeeded.use-case";
import type { WalletCommandPublisher } from "../../../../src/application/ports/wallet-command.publisher";
import type { WalletDebitRequestedEnvelope } from "../../../../src/application/messaging/wallet-events";
import {
  WALLET_DEBIT_FAILED,
  WALLET_DEBIT_SUCCEEDED,
} from "../../../../src/application/messaging/wallet-events";
import { InMemoryGameRoundsRepository } from "../../../../src/infrastructure/persistence/in-memory-game-rounds.repository";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";
import { RoundStatus } from "../../../../src/domain/value-objects/round-status";

describe("Game API use cases", () => {
  class FakeWalletCommandPublisher implements WalletCommandPublisher {
    readonly debitRequests: WalletDebitRequestedEnvelope[] = [];

    async publishDebitRequested(
      envelope: WalletDebitRequestedEnvelope,
    ): Promise<void> {
      this.debitRequests.push(envelope);
    }
  }

  function createFixture() {
    const provablyFairService = new ProvablyFairService();
    const repository = new InMemoryGameRoundsRepository(provablyFairService);
    const walletCommandPublisher = new FakeWalletCommandPublisher();

    return {
      provablyFairService,
      repository,
      walletCommandPublisher,
    };
  }

  it("returns the current round response", async () => {
    const { repository } = createFixture();
    const useCase = new GetCurrentRoundUseCase(repository);

    const result = await useCase.execute();

    expect(result.status).toBe(RoundStatus.BETTING);
    expect(typeof result.serverSeedHash).toBe("string");
    expect(result.currentMultiplier).toBe("1.00");
  });

  it("returns paginated round history", async () => {
    const { repository } = createFixture();
    const useCase = new GetRoundHistoryUseCase(repository);

    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(typeof result.items[0]?.serverSeed).toBe("string");
    expect(result.items[0]?.crashPoint).toBe("1.07");
  });

  it("returns verification data for a finished history round", async () => {
    const { provablyFairService, repository } = createFixture();
    const history = await new GetRoundHistoryUseCase(repository).execute({
      page: 1,
      pageSize: 20,
    });
    const useCase = new GetRoundVerificationUseCase(
      provablyFairService,
      repository,
    );

    const result = await useCase.execute(history.items[0]?.id ?? "");

    expect(result.algorithm).toBe("HMAC_SHA256_SHA256_HASH_COMMITMENT");
    expect(result.crashPoint).toBe("1.07");
    expect(result.houseEdgePercent).toBe(1);
  });

  it("places a bet and publishes wallet.debit.requested", async () => {
    const { repository, walletCommandPublisher } = createFixture();
    const useCase = new PlaceBetUseCase(repository, walletCommandPublisher);

    const result = await useCase.execute({
      playerId: "player-1",
      body: { amountCents: "1000" },
    });
    const bets = await new GetPlayerBetsUseCase(repository).execute({
      playerId: "player-1",
    });

    expect(result.status).toBe("PENDING");
    expect(typeof result.roundId).toBe("string");
    expect(typeof result.idempotencyKey).toBe("string");
    expect(bets.items[0]?.status).toBe("PENDING_DEBIT");
    expect(walletCommandPublisher.debitRequests).toHaveLength(1);
    expect(walletCommandPublisher.debitRequests[0]?.type).toBe(
      "wallet.debit.requested",
    );
  });

  it("accepts a pending bet when wallet debit succeeds", async () => {
    const { repository, walletCommandPublisher } = createFixture();
    await new PlaceBetUseCase(repository, walletCommandPublisher).execute({
      playerId: "player-1",
      body: { amountCents: "1000" },
    });
    const request = walletCommandPublisher.debitRequests[0];

    await new HandleWalletDebitSucceededUseCase(repository).execute({
      messageId: "wallet-result-1",
      type: WALLET_DEBIT_SUCCEEDED,
      version: 1,
      correlationId: request?.correlationId ?? "correlation-1",
      causationId: request?.messageId ?? null,
      idempotencyKey: request?.idempotencyKey ?? "debit-1",
      occurredAt: new Date().toISOString(),
      producer: "wallets-service",
      payload: {
        playerId: "player-1",
        walletId: "wallet-1",
        roundId: request?.payload.roundId ?? "",
        betId: request?.payload.betId ?? "",
        amountCents: "1000",
        balanceAfterCents: "99000",
      },
    });

    const bets = await new GetPlayerBetsUseCase(repository).execute({
      playerId: "player-1",
    });

    expect(bets.items[0]?.status).toBe("PLACED");
  });

  it("rejects a pending bet when wallet debit fails", async () => {
    const { repository, walletCommandPublisher } = createFixture();
    await new PlaceBetUseCase(repository, walletCommandPublisher).execute({
      playerId: "player-1",
      body: { amountCents: "1000" },
    });
    const request = walletCommandPublisher.debitRequests[0];

    await new HandleWalletDebitFailedUseCase(repository).execute({
      messageId: "wallet-result-1",
      type: WALLET_DEBIT_FAILED,
      version: 1,
      correlationId: request?.correlationId ?? "correlation-1",
      causationId: request?.messageId ?? null,
      idempotencyKey: request?.idempotencyKey ?? "debit-1",
      occurredAt: new Date().toISOString(),
      producer: "wallets-service",
      payload: {
        playerId: "player-1",
        roundId: request?.payload.roundId ?? "",
        betId: request?.payload.betId ?? "",
        amountCents: "1000",
        reason: "INSUFFICIENT_BALANCE",
      },
    });

    const bets = await new GetPlayerBetsUseCase(repository).execute({
      playerId: "player-1",
    });

    expect(bets.items[0]?.status).toBe("REJECTED");
  });

  it("cashs out a placed bet with temporary wallet credit mock", async () => {
    const { repository, walletCommandPublisher } = createFixture();
    await new PlaceBetUseCase(repository, walletCommandPublisher).execute({
      playerId: "player-1",
      body: { amountCents: "1000" },
    });
    const request = walletCommandPublisher.debitRequests[0];
    await new HandleWalletDebitSucceededUseCase(repository).execute({
      messageId: "wallet-result-1",
      type: WALLET_DEBIT_SUCCEEDED,
      version: 1,
      correlationId: request?.correlationId ?? "correlation-1",
      causationId: request?.messageId ?? null,
      idempotencyKey: request?.idempotencyKey ?? "debit-1",
      occurredAt: new Date().toISOString(),
      producer: "wallets-service",
      payload: {
        playerId: "player-1",
        walletId: "wallet-1",
        roundId: request?.payload.roundId ?? "",
        betId: request?.payload.betId ?? "",
        amountCents: "1000",
        balanceAfterCents: "99000",
      },
    });
    const currentRound = await repository.findCurrent();
    currentRound.start(new Date("2026-06-14T12:00:11.000Z"));

    const result = await new CashOutBetUseCase(repository).execute({
      playerId: "player-1",
    });

    expect(result.status).toBe("PENDING");
    expect(result.currentMultiplier).toBe("1.00");
    expect(result.estimatedPayoutCents).toBe("1000");
  });
});
