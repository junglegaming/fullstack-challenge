import { describe, expect, it } from "vitest";
import {
  calculateGainedBasisPoints,
  calculateMultiplierBasisPoints,
  calculateMultiplierDisplay,
  calibrateStartedAtMs,
  computeServerTimeOffsetMs,
  getServerNowMs,
  interpolateMultiplierBetweenTicks,
  resolveRunningMultiplierDisplay,
} from "./multiplier-growth";

const balancedConfig = {
  growthBasisPointsPerSecond: 40,
  boostAfterGainedBasisPoints: 100,
  boostGrowthBasisPointsPerSecond: 60,
  highBoostAfterGainedBasisPoints: 1900,
  highGrowthBasisPointsPerSecond: 150,
};

const backendLinearConfig = {
  growthBasisPointsPerSecond: 100,
};

const dockerLinearConfig = {
  growthBasisPointsPerSecond: 40,
};

describe("multiplier growth", () => {
  it("matches backend linear growth at 100 bps per second", () => {
    expect(calculateMultiplierDisplay(1500, backendLinearConfig)).toBe("2.50");
    expect(calculateMultiplierDisplay(2500, backendLinearConfig)).toBe("3.50");
    expect(calculateMultiplierDisplay(10_000, backendLinearConfig)).toBe("11.00");
  });

  it("matches backend docker default growth at 40 bps per second", () => {
    expect(calculateMultiplierDisplay(2500, dockerLinearConfig)).toBe("2.00");
    expect(calculateMultiplierDisplay(10_000, dockerLinearConfig)).toBe("5.00");
  });

  it("uses base growth before 2.00x", () => {
    expect(calculateMultiplierDisplay(2500, balancedConfig)).toBe("2.00");
  });

  it("grows moderately between 2.00x and 20.00x", () => {
    expect(calculateMultiplierDisplay(32_500, balancedConfig)).toBe("20.00");
  });

  it("accelerates after 20.00x without jumping too fast", () => {
    expect(calculateMultiplierDisplay(39_167, balancedConfig)).toBe("30.00");
  });

  it("keeps linear growth when boost is disabled", () => {
    expect(
      calculateGainedBasisPoints(1500, {
        growthBasisPointsPerSecond: 100,
      }),
    ).toBe(150);
  });

  it("interpolates smoothly between websocket ticks", () => {
    const from = { multiplier: 8, at: 1000 };
    const to = { multiplier: 10, at: 1250 };

    expect(interpolateMultiplierBetweenTicks(from, to, 1125)).toBe("9.00");
    expect(interpolateMultiplierBetweenTicks(from, to, 1250)).toBe("10.00");
  });

  it("calibrates startedAt from authoritative server ticks", () => {
    const startedAtMs = 0;
    const tick = { multiplier: 2, at: 2500 };
    const calibrated = calibrateStartedAtMs(startedAtMs, tick, balancedConfig);

    expect(
      calculateMultiplierDisplay(2500 - calibrated, balancedConfig),
    ).toBe("2.00");
  });

  it("uses server time offset to avoid client clock drift", () => {
    const clientNowMs = 1_000_000;
    const serverTimeIso = new Date(clientNowMs + 5_000).toISOString();
    const offset = computeServerTimeOffsetMs(serverTimeIso, clientNowMs);

    expect(getServerNowMs(offset, clientNowMs)).toBe(clientNowMs + 5_000);
  });

  it("keeps visual multiplier aligned with backend formula at crash time", () => {
    const startedAtMs = 1_000_000;
    const crashElapsedMs = 7_500;
    const serverNowMs = startedAtMs + crashElapsedMs;
    const crashPoint = calculateMultiplierDisplay(crashElapsedMs, backendLinearConfig);

    expect(crashPoint).toBe("8.50");
    expect(
      resolveRunningMultiplierDisplay(serverNowMs, startedAtMs, backendLinearConfig),
    ).toBe(crashPoint);
  });

  it("does not lag behind backend when client clock is behind server", () => {
    const startedAtMs = 0;
    const serverNowMs = 3_000;
    const clientNowMs = 1_000;
    const offset = serverNowMs - clientNowMs;

    expect(
      resolveRunningMultiplierDisplay(
        getServerNowMs(offset, clientNowMs),
        startedAtMs,
        backendLinearConfig,
      ),
    ).toBe("4.00");
  });

  it("exposes basis points helper for formula parity checks", () => {
    expect(calculateMultiplierBasisPoints(1500, backendLinearConfig)).toBe(250);
  });
});
