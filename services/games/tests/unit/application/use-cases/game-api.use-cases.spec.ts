import { describe, expect, it } from "bun:test";
import { GetCurrentRoundUseCase } from "../../../../src/application/use-cases/get-current-round.use-case";
import { GetPlayerBetsUseCase } from "../../../../src/application/use-cases/get-player-bets.use-case";
import { GetRoundHistoryUseCase } from "../../../../src/application/use-cases/get-round-history.use-case";
import { GetRoundVerificationUseCase } from "../../../../src/application/use-cases/get-round-verification.use-case";
import { PlaceBetUseCase } from "../../../../src/application/use-cases/place-bet.use-case";
import { CashOutBetUseCase } from "../../../../src/application/use-cases/cash-out-bet.use-case";
import { InMemoryGameRoundsRepository } from "../../../../src/infrastructure/persistence/in-memory-game-rounds.repository";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";
import { RoundStatus } from "../../../../src/domain/value-objects/round-status";

describe("Game API use cases", () => {
  function createFixture() {
    const provablyFairService = new ProvablyFairService();
    const repository = new InMemoryGameRoundsRepository(provablyFairService);

    return {
      provablyFairService,
      repository,
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

  it("places a bet with temporary wallet debit mock", async () => {
    const { repository } = createFixture();
    const useCase = new PlaceBetUseCase(repository);

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
    expect(bets.items[0]?.status).toBe("PLACED");
  });

  it("cashs out a placed bet with temporary wallet credit mock", async () => {
    const { repository } = createFixture();
    await new PlaceBetUseCase(repository).execute({
      playerId: "player-1",
      body: { amountCents: "1000" },
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
