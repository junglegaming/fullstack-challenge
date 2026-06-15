import { E2E_CONFIG } from "./config";
import { expectJson } from "./http";
import { waitFor } from "./poll";

export type WalletResponse = {
  id: string;
  playerId: string;
  balanceCents: string;
  balanceFormatted: string;
};

export class E2EWalletsApiClient {
  constructor(private readonly accessToken: string) {}

  async createWallet(): Promise<WalletResponse> {
    const response = await fetch(`${E2E_CONFIG.apiBaseUrl}/wallets`, {
      method: "POST",
      headers: this.authHeaders(),
    });
    return expectJson<WalletResponse>(response);
  }

  async createWalletRaw(): Promise<Response> {
    return fetch(`${E2E_CONFIG.apiBaseUrl}/wallets`, {
      method: "POST",
      headers: this.authHeaders(),
    });
  }

  async getMyWallet(): Promise<WalletResponse> {
    const response = await fetch(`${E2E_CONFIG.apiBaseUrl}/wallets/me`, {
      headers: this.authHeaders(),
    });
    return expectJson<WalletResponse>(response);
  }

  async getMyWalletRaw(): Promise<Response> {
    return fetch(`${E2E_CONFIG.apiBaseUrl}/wallets/me`, {
      headers: this.authHeaders(),
    });
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.accessToken}` };
  }
}

export async function ensureStackIsReady(): Promise<void> {
  await waitFor("wallets health", async () => {
    const response = await fetch(`${E2E_CONFIG.walletsBaseUrl}/health`);

    if (response.ok) {
      return true;
    }

    return null;
  }, { timeoutMs: 15_000 });
}
