import { describe, expect, it } from "vitest";
import type { BetSummary } from "../services/api";
import {
  mergeRoundBets,
  pickPreferredBet,
  resolveMyActiveBet,
} from "./active-bet";

const playerId = "00000000-0000-4000-8000-000000000001";
const roundId = "round-1";

function createBet(overrides: Partial<BetSummary> = {}): BetSummary {
  return {
    id: "bet-1",
    roundId,
    playerId,
    amountCents: "1000",
    status: "PLACED",
    cashOutMultiplier: null,
    payoutCents: null,
    ...overrides,
  };
}

describe("active bet resolution", () => {
  it("prefers PLACED over PENDING_DEBIT for the same bet id", () => {
    const pending = createBet({ status: "PENDING_DEBIT" });
    const placed = createBet({ status: "PLACED" });

    expect(pickPreferredBet(pending, placed)).toEqual(placed);
  });

  it("resolves active bet from websocket state when REST is still pending", () => {
    const myBets = [createBet({ status: "PENDING_DEBIT" })];
    const roundBets = [createBet({ status: "PLACED" })];

    expect(
      resolveMyActiveBet(roundId, playerId, myBets, roundBets, []),
    ).toEqual(createBet({ status: "PLACED" }));
  });

  it("keeps websocket PLACED bet when API polling returns stale pending state", () => {
    const apiBets = [createBet({ status: "PENDING_DEBIT" })];
    const localBets = [createBet({ status: "PLACED" })];

    expect(mergeRoundBets(apiBets, localBets, roundId)).toEqual([
      createBet({ status: "PLACED" }),
    ]);
  });

  it("returns undefined when player has no bet in the current round", () => {
    expect(resolveMyActiveBet(roundId, playerId, [], [])).toBeUndefined();
  });

  it("resolves placed bet from current round bets when my bets page is stale", () => {
    const currentRoundBets = [createBet({ status: "PLACED" })];

    expect(
      resolveMyActiveBet(roundId, playerId, [], [], currentRoundBets),
    ).toEqual(createBet({ status: "PLACED" }));
  });

  it("returns only placed bets for cash out eligibility", () => {
    const pending = createBet({ id: "bet-pending", status: "PENDING_DEBIT" });
    const placed = createBet({ id: "bet-placed", status: "PLACED" });

    expect(
      resolveMyActiveBet(roundId, playerId, [pending], [placed], []),
    ).toEqual(placed);
  });
});
