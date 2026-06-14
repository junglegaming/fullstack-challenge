import { describe, expect, it } from "bun:test";
import { GetRoundVerificationUseCase } from "../../../../src/application/use-cases/get-round-verification.use-case";
import { PROVABLY_FAIR_TEST_FIXTURE } from "../../../../src/domain/constants/provably-fair";
import { Round } from "../../../../src/domain/entities/round";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";

describe("GetRoundVerificationUseCase", () => {
  it("maps round verification data for GET /games/rounds/:roundId/verify", () => {
    const provablyFairService = new ProvablyFairService();
    const useCase = new GetRoundVerificationUseCase(provablyFairService);

    const round = Round.createProvablyFair({
      provablyFairService,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
      bettingStartedAt: new Date("2026-06-14T12:00:00.000Z"),
      bettingEndsAt: new Date("2026-06-14T12:00:10.000Z"),
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
    });

    round.start(new Date("2026-06-14T12:00:11.000Z"));
    round.crash(new Date("2026-06-14T12:00:20.000Z"));

    const result = useCase.executeFromRound(round);

    expect(result).toEqual({
      roundId: round.id.toString(),
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
      serverSeedHash: PROVABLY_FAIR_TEST_FIXTURE.expectedServerSeedHash,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
      algorithm: "HMAC_SHA256_SHA256_HASH_COMMITMENT",
      houseEdgePercent: 1,
      crashPoint: PROVABLY_FAIR_TEST_FIXTURE.expectedCrashPointDisplay,
    });
  });
});
