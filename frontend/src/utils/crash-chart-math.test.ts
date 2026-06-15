import { describe, expect, it } from "vitest";
import {
  buildCrashCurvePath,
  estimatePayoutCents,
  exponentialHeightProgress,
  multiplierToTimeProgress,
  resolveDisplayCap,
} from "./crash-chart-math";

describe("crash chart math", () => {
  it("maps 1x multiplier to zero progress", () => {
    expect(multiplierToTimeProgress(1)).toBe(0);
  });

  it("increases time progress as multiplier grows", () => {
    expect(multiplierToTimeProgress(2)).toBeGreaterThan(
      multiplierToTimeProgress(1.5),
    );
    expect(multiplierToTimeProgress(5)).toBeGreaterThan(
      multiplierToTimeProgress(2),
    );
  });

  it("accelerates height with exponential easing", () => {
    expect(exponentialHeightProgress(0.2)).toBeLessThan(0.2);

    const earlySlope =
      exponentialHeightProgress(0.2) - exponentialHeightProgress(0.1);
    const lateSlope =
      exponentialHeightProgress(0.8) - exponentialHeightProgress(0.7);
    expect(lateSlope).toBeGreaterThan(earlySlope);
  });

  it("expands display cap for high multipliers", () => {
    expect(resolveDisplayCap(3)).toBe(10);
    expect(resolveDisplayCap(45)).toBe(100);
    expect(resolveDisplayCap(900)).toBe(2500);
  });

  it("builds an upward exponential curve from the bottom-left origin", () => {
    const atStart = buildCrashCurvePath(1, 400, 180);
    const early = buildCrashCurvePath(1.8, 400, 180);
    const late = buildCrashCurvePath(6, 400, 180);

    expect(atStart.tipY).toBeGreaterThan(early.tipY);
    expect(early.tipY).toBeGreaterThan(late.tipY);
    expect(late.tipX).toBeGreaterThan(early.tipX);

    const earlyVerticalGain = atStart.tipY - early.tipY;
    const lateVerticalGain = early.tipY - late.tipY;
    expect(lateVerticalGain).toBeGreaterThan(earlyVerticalGain);
  });

  it("keeps the curve inside the chart for very high multipliers", () => {
    const high = buildCrashCurvePath(250, 400, 180);

    expect(high.tipY).toBeGreaterThanOrEqual(16);
    expect(high.tipX).toBeLessThanOrEqual(384);
    expect(high.displayCap).toBeGreaterThanOrEqual(250);
  });

  it("estimates payout using bigint cents", () => {
    expect(estimatePayoutCents("1000", "2.50")).toBe(2500n);
  });
});
