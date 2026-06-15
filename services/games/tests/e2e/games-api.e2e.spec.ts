import { beforeAll, describe, expect, it, setDefaultTimeout } from "bun:test";
import { getAccessToken } from "./support/auth";
import { E2EApiClient } from "./support/api-client";
import { E2E_CONFIG } from "./support/config";
import { ensureStackIsReady } from "./support/gameplay";
import type { ApiErrorBody } from "./support/http";

setDefaultTimeout(120_000);

describe("Games API E2E", () => {
  let client: E2EApiClient;

  beforeAll(async () => {
    const token = await getAccessToken();
    client = new E2EApiClient(token);
    await ensureStackIsReady(client);
  });

  it("GET /games/rounds/history returns paginated settled rounds without auth", async () => {
    const response = await client.getRoundHistoryRaw(1, 20);
    expect(response.status).toBe(200);

    const history = await response.json();
    expect(history.page).toBe(1);
    expect(history.pageSize).toBe(20);
    expect(history.total).toBeGreaterThanOrEqual(1);
    expect(history.items.length).toBeGreaterThanOrEqual(1);

    const historyItem = history.items[0];
    expect(historyItem.id).toBeTruthy();
    expect(historyItem.crashPoint).toMatch(/^\d+\.\d{2}$/);
    expect(historyItem.serverSeedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(historyItem.serverSeed).toMatch(/^[a-f0-9]{64}$/);
    expect(historyItem.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("GET /games/rounds/:roundId/verify returns provably fair data for finished round", async () => {
    const history = await client.getRoundHistory(1, 20);
    const finishedRound = history.items[0];

    expect(finishedRound).toBeTruthy();

    const verification = await client.verifyRound(finishedRound.id);

    expect(verification.roundId).toBe(finishedRound.id);
    expect(verification.serverSeed).toBe(finishedRound.serverSeed);
    expect(verification.serverSeedHash).toBe(finishedRound.serverSeedHash);
    expect(verification.clientSeed).toBeTruthy();
    expect(verification.nonce).toBeGreaterThanOrEqual(0);
    expect(verification.algorithm).toBe("HMAC_SHA256_SHA256_HASH_COMMITMENT");
    expect(verification.houseEdgePercent).toBe(1);
    expect(verification.crashPoint).toBe(finishedRound.crashPoint);
  });

  it("GET /games/rounds/:roundId/verify rejects unfinished current round", async () => {
    const currentRound = await client.getCurrentRound();
    const response = await client.verifyRoundRaw(currentRound.id);

    expect(response.status).toBe(404);

    const errorBody = (await response.json()) as ApiErrorBody;
    expect(errorBody.code).toBe("ROUND_NOT_FINISHED");
  });

  it("rejects protected routes when JWT is missing", async () => {
    const betsResponse = await fetch(`${E2E_CONFIG.apiBaseUrl}/games/bets/me`);
    expect(betsResponse.status).toBe(401);

    const betsBody = (await betsResponse.json()) as ApiErrorBody;
    expect(betsBody.message).toBe("Missing bearer token");

    const placeBetResponse = await fetch(`${E2E_CONFIG.apiBaseUrl}/games/bet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: "1000" }),
    });
    expect(placeBetResponse.status).toBe(401);

    const placeBetBody = (await placeBetResponse.json()) as ApiErrorBody;
    expect(placeBetBody.message).toBe("Missing bearer token");

    const cashOutResponse = await fetch(`${E2E_CONFIG.apiBaseUrl}/games/bet/cashout`, {
      method: "POST",
    });
    expect(cashOutResponse.status).toBe(401);

    const cashOutBody = (await cashOutResponse.json()) as ApiErrorBody;
    expect(cashOutBody.message).toBe("Missing bearer token");
  });
});
