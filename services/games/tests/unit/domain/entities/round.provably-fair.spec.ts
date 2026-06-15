import { describe, expect, it } from "bun:test";
import { GetRoundVerificationUseCase } from "../../../../src/application/use-cases/get-round-verification.use-case";
import { PROVABLY_FAIR_TEST_FIXTURE } from "../../../../src/domain/constants/provably-fair";
import { Round } from "../../../../src/domain/entities/round";
import { RoundNotFinishedError } from "../../../../src/domain/errors/round-not-finished.error";
import { InvalidServerSeedError } from "../../../../src/domain/errors/invalid-server-seed.error";
import { ProvablyFairService } from "../../../../src/domain/services/provably-fair.service";
import { RoundStatus } from "../../../../src/domain/value-objects/round-status";

describe("Round provably fair", () => {
  const provablyFairService = new ProvablyFairService();
  const bettingStartedAt = new Date("2026-06-14T12:00:00.000Z");
  const bettingEndsAt = new Date("2026-06-14T12:00:10.000Z");
  const runningAt = new Date("2026-06-14T12:00:11.000Z");
  const crashedAt = new Date("2026-06-14T12:00:20.000Z");

  it("creates round exposing only server seed hash before crash", () => {
    const round = Round.createProvablyFair({
      provablyFairService,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
      bettingStartedAt,
      bettingEndsAt,
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
    });

    expect(round.serverSeedHash).toBe(PROVABLY_FAIR_TEST_FIXTURE.expectedServerSeedHash);
    expect(round.serverSeed).toBeNull();
    expect(round.isServerSeedRevealed()).toBe(false);
    expect(round.crashPoint.valueInBasisPoints).toBe(
      PROVABLY_FAIR_TEST_FIXTURE.expectedCrashPointBps,
    );
  });

  it("reveals server seed after crash", () => {
    const round = Round.createProvablyFair({
      provablyFairService,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
      bettingStartedAt,
      bettingEndsAt,
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
    });

    round.start(runningAt);
    round.crash(crashedAt);

    expect(round.status).toBe(RoundStatus.CRASHED);
    expect(round.serverSeed).toBe(PROVABLY_FAIR_TEST_FIXTURE.serverSeed);
    expect(round.isServerSeedRevealed()).toBe(true);
  });

  it("rejects manual reveal when hash does not match", () => {
    const round = Round.createProvablyFair({
      provablyFairService,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
      bettingStartedAt,
      bettingEndsAt,
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
    });

    expect(() =>
      round.revealServerSeed("deadbeef".repeat(8), provablyFairService),
    ).toThrow(InvalidServerSeedError);
  });

  it("rejects verification before round is finished", () => {
    const round = Round.createProvablyFair({
      provablyFairService,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
      bettingStartedAt,
      bettingEndsAt,
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
    });

    expect(() => round.toVerificationData(provablyFairService)).toThrow(
      RoundNotFinishedError,
    );
  });

  it("builds verification payload for future verify endpoint", () => {
    const round = Round.createProvablyFair({
      provablyFairService,
      clientSeed: PROVABLY_FAIR_TEST_FIXTURE.clientSeed,
      nonce: PROVABLY_FAIR_TEST_FIXTURE.nonce,
      bettingStartedAt,
      bettingEndsAt,
      serverSeed: PROVABLY_FAIR_TEST_FIXTURE.serverSeed,
    });

    round.start(runningAt);
    round.crash(crashedAt);

    const useCase = new GetRoundVerificationUseCase(provablyFairService);
    const verification = useCase.executeFromRound(round);

    expect(verification.roundId).toBe(round.id.toString());
    expect(verification.serverSeed).toBe(PROVABLY_FAIR_TEST_FIXTURE.serverSeed);
    expect(verification.serverSeedHash).toBe(
      PROVABLY_FAIR_TEST_FIXTURE.expectedServerSeedHash,
    );
    expect(verification.clientSeed).toBe(PROVABLY_FAIR_TEST_FIXTURE.clientSeed);
    expect(verification.nonce).toBe(PROVABLY_FAIR_TEST_FIXTURE.nonce);
    expect(verification.algorithm).toBe("HMAC_SHA256_SHA256_HASH_COMMITMENT");
    expect(verification.houseEdgePercent).toBe(1);
    expect(verification.crashPoint).toBe(
      PROVABLY_FAIR_TEST_FIXTURE.expectedCrashPointDisplay,
    );
  });
});
