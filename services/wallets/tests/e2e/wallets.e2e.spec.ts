import { beforeAll, describe, expect, it, setDefaultTimeout } from "bun:test";
import { getAccessToken } from "./support/auth";
import { E2EWalletsApiClient, ensureStackIsReady } from "./support/api-client";
import { E2E_CONFIG } from "./support/config";
import type { ApiErrorBody } from "./support/http";

setDefaultTimeout(120_000);

describe("Wallets E2E", () => {
  let client: E2EWalletsApiClient;

  beforeAll(async () => {
    await ensureStackIsReady();
    const token = await getAccessToken();
    client = new E2EWalletsApiClient(token);
  });

  it("rejects protected routes when JWT is missing", async () => {
    const createResponse = await fetch(`${E2E_CONFIG.apiBaseUrl}/wallets`, {
      method: "POST",
    });
    expect(createResponse.status).toBe(401);

    const createBody = (await createResponse.json()) as ApiErrorBody;
    expect(createBody.message).toBe("Missing bearer token");

    const getResponse = await fetch(`${E2E_CONFIG.apiBaseUrl}/wallets/me`);
    expect(getResponse.status).toBe(401);

    const getBody = (await getResponse.json()) as ApiErrorBody;
    expect(getBody.message).toBe("Missing bearer token");
  });

  it("POST /wallets creates wallet for authenticated user", async () => {
    const existingResponse = await client.getMyWalletRaw();

    if (existingResponse.status === 404) {
      const wallet = await client.createWallet();

      expect(wallet.id).toBeTruthy();
      expect(wallet.playerId).toBeTruthy();
      expect(wallet.balanceCents).toBe(E2E_CONFIG.initialBalanceCents);
      expect(wallet.balanceFormatted).toBeTruthy();
      return;
    }

    expect(existingResponse.status).toBe(200);
    const existingWallet = (await existingResponse.json()) as {
      id: string;
      playerId: string;
      balanceCents: string;
    };

    expect(existingWallet.id).toBeTruthy();
    expect(existingWallet.playerId).toBeTruthy();
    expect(existingWallet.balanceCents).toMatch(/^\d+$/);
  });

  it("GET /wallets/me returns wallet balance", async () => {
    const wallet = await client.getMyWallet();

    expect(wallet.id).toBeTruthy();
    expect(wallet.playerId).toBeTruthy();
    expect(wallet.balanceCents).toMatch(/^\d+$/);
    expect(wallet.balanceFormatted).toMatch(/^\d+\.\d{2}$/);
    expect(BigInt(wallet.balanceCents)).toBeGreaterThanOrEqual(0n);
  });

  it("returns conflict when creating duplicate wallet", async () => {
    const response = await client.createWalletRaw();
    expect(response.status).toBe(409);

    const errorBody = (await response.json()) as ApiErrorBody;
    expect(errorBody.code).toBe("WALLET_ALREADY_EXISTS");
  });
});
