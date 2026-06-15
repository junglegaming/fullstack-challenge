import { describe, expect, it, vi } from "vitest";
import {
  formatBettingCountdown,
  getBettingSecondsRemaining,
} from "./betting-countdown";

describe("betting countdown", () => {
  it("returns remaining whole seconds until betting ends", () => {
    expect(
      getBettingSecondsRemaining("2026-01-01T00:00:30.000Z", Date.parse("2026-01-01T00:00:22.500Z")),
    ).toBe(8);
    expect(
      getBettingSecondsRemaining("2026-01-01T00:00:30.000Z", Date.parse("2026-01-01T00:00:30.000Z")),
    ).toBe(0);
  });

  it("formats countdown as mm:ss", () => {
    expect(formatBettingCountdown(8)).toBe("0:08");
    expect(formatBettingCountdown(75)).toBe("1:15");
  });
});
