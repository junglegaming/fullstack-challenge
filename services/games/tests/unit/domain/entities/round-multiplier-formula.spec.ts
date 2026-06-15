import { describe, expect, it } from "bun:test";
import { Round } from "../../../../src/domain/entities/round";
import {
  calculateGainedBasisPoints,
  calculateMultiplierBasisPoints,
} from "../../../../src/domain/services/multiplier-growth";
import { Multiplier } from "../../../../src/domain/value-objects/multiplier";

describe("Round multiplier formula consistency", () => {
  const growthConfig = {
    growthBasisPointsPerSecond: 100,
    boostAfterGainedBasisPoints: 100,
    boostGrowthBasisPointsPerSecond: 60,
  };

  const runningAt = new Date("2026-06-14T12:00:05.000Z");

  function createRunningRound(): Round {
    const round = Round.create({
      serverSeedHash: "hash",
      clientSeed: "client-seed",
      nonce: 1,
      crashPoint: Multiplier.fromBasisPoints(10_000),
      bettingStartedAt: new Date("2026-06-14T12:00:00.000Z"),
      bettingEndsAt: runningAt,
    });
    round.start(runningAt);
    return round;
  }

  it("uses the same gained basis points function as multiplier-growth service", () => {
    const round = createRunningRound();
    const now = new Date(runningAt.getTime() + 3_250);

    const elapsedMs = now.getTime() - runningAt.getTime();
    const expectedBasisPoints = calculateMultiplierBasisPoints(
      elapsedMs,
      growthConfig,
    );

    expect(
      round.getCurrentMultiplier(now, { growthConfig }).valueInBasisPoints,
    ).toBe(expectedBasisPoints);
  });

  it("matches linear growth before boost threshold", () => {
    const round = createRunningRound();
    const elapsedMs = 2_500;
    const now = new Date(runningAt.getTime() + elapsedMs);

    expect(
      round.getCurrentMultiplier(now, { growthConfig }).toDecimalString(),
    ).toBe("3.50");
    expect(calculateGainedBasisPoints(elapsedMs, growthConfig)).toBe(250);
  });
});
