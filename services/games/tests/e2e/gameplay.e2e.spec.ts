import { beforeAll, describe, expect, it, setDefaultTimeout } from "bun:test";
import { getAccessToken } from "./support/auth";
import { E2EApiClient } from "./support/api-client";
import {
  ensureStackIsReady,
  placeBetAndWaitPlaced,
  placeBetDuringBetting,
  prepareInsufficientBalanceAttempt,
  placeBetAndCashOut,
  waitForBettingRound,
  waitForLatestPlayerBetStatus,
  waitForPlayerBetStatus,
  waitForRoundStatus,
  waitForWalletBalanceAtLeast,
} from "./support/gameplay";
import { waitFor } from "./support/poll";

setDefaultTimeout(120_000);
describe("Gameplay E2E", () => {
  let client: E2EApiClient;

  beforeAll(async () => {
    const token = await getAccessToken();
    client = new E2EApiClient(token);
    await ensureStackIsReady(client);
  });

  it("rejects bet when balance is insufficient", async () => {
    const { roundId, balanceBefore } = await prepareInsufficientBalanceAttempt(client);

    await waitForPlayerBetStatus(client, roundId, "REJECTED");

    const balanceAfter = BigInt((await client.getWallet()).balanceCents);
    expect(balanceAfter).toBe(balanceBefore);
  });

  it("rejects duplicate bet in the same round", async () => {
    const playerId = await client.resolvePlayerId();
    await waitFor("betting round without existing player bet", async () => {
      const round = await client.getCurrentRound();

      if (
        round.status === "BETTING" &&
        !client.findPlayerBetInRound(round, playerId)
      ) {
        return round;
      }

      return null;
    });

    const round = await client.getCurrentRound();
    await client.placeBet("1000");

    await waitForPlayerBetStatus(client, round.id, "PLACED");

    const duplicateResponse = await client.placeBetRaw("1000");
    expect(duplicateResponse.status).toBe(409);

    const errorBody = (await duplicateResponse.json()) as { code: string };
    expect(errorBody.code).toBe("DUPLICATE_BET");
  });

  it("rejects bet while round is RUNNING", async () => {
    const roundId = await waitForRoundStatus(client, "RUNNING");

    const response = await client.placeBetRaw("1000");
    expect(response.status).toBe(409);

    const errorBody = (await response.json()) as { code: string };
    expect(errorBody.code).toBe("BET_NOT_ALLOWED");

    await waitForBettingRound(client);

    const current = await client.getCurrentRound();
    expect(current.id).not.toBe(roundId);
  });

  it("places bet, cashes out, and increases wallet balance", async () => {
    const balanceBefore = BigInt((await client.getWallet()).balanceCents);
    const betAmount = 2_000n;

    const { roundId, cashOut } = await placeBetAndCashOut(
      client,
      betAmount.toString(),
    );
    expect(cashOut.roundId).toBe(roundId);
    await waitForWalletBalanceAtLeast(client, balanceBefore);

    const balanceAfter = BigInt((await client.getWallet()).balanceCents);
    expect(balanceAfter).toBeGreaterThanOrEqual(balanceBefore);
  });

  it("places bet, waits for crash, and marks bet as LOST", async () => {
    const balanceBefore = BigInt((await client.getWallet()).balanceCents);
    const betAmount = 1_500n;

    const { roundId } = await placeBetAndWaitPlaced(client, betAmount.toString());
    await waitForRoundStatus(client, "RUNNING");
    await waitForRoundStatus(client, "CRASHED");
    await waitForLatestPlayerBetStatus(client, "LOST");

    const balanceAfter = BigInt((await client.getWallet()).balanceCents);
    expect(balanceAfter).toBe(balanceBefore - betAmount);
  });
});