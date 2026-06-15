import { E2E_CONFIG } from "./config";
import { expectJson } from "./http";

export type BetSummary = {
  id: string;
  roundId: string;
  playerId: string;
  amountCents: string;
  status: string;
  cashOutMultiplier: string | null;
  payoutCents: string | null;
  payoutSettlementStatus: string | null;
  payoutSettlementFailureReason: string | null;
};

export type CurrentRound = {
  id: string;
  status: string;
  bettingEndsAt: string;
  currentMultiplier: string;
  bets: BetSummary[];
};

export type WalletResponse = {
  balanceCents: string;
  playerId: string;
};

export type PlaceBetResponse = {
  status: string;
  roundId: string;
  idempotencyKey: string;
};

export type CashOutResponse = {
  status: string;
  roundId: string;
  currentMultiplier: string;
  estimatedPayoutCents: string;
  idempotencyKey: string;
};

export type PaginatedBets = {
  items: BetSummary[];
  total: number;
};

export class E2EApiClient {
  private playerId: string | null = null;

  constructor(private readonly accessToken: string) {}

  async resolvePlayerId(): Promise<string> {
    if (this.playerId) {
      return this.playerId;
    }

    const wallet = await this.getWallet();
    this.playerId = wallet.playerId;
    return this.playerId;
  }

  async getCurrentRound(): Promise<CurrentRound> {
    const response = await fetch(`${E2E_CONFIG.apiBaseUrl}/games/rounds/current`);
    return expectJson<CurrentRound>(response);
  }

  async getWallet(): Promise<WalletResponse> {
    const response = await fetch(`${E2E_CONFIG.apiBaseUrl}/wallets/me`, {
      headers: this.authHeaders(),
    });
    return expectJson<WalletResponse>(response);
  }

  async getMyBets(): Promise<PaginatedBets> {
    const response = await fetch(`${E2E_CONFIG.apiBaseUrl}/games/bets/me?pageSize=50`, {
      headers: this.authHeaders(),
    });
    return expectJson<PaginatedBets>(response);
  }

  async placeBet(amountCents: string): Promise<PlaceBetResponse> {
    const response = await fetch(`${E2E_CONFIG.apiBaseUrl}/games/bet`, {
      method: "POST",
      headers: {
        ...this.authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountCents }),
    });
    return expectJson<PlaceBetResponse>(response, 202);
  }

  async placeBetRaw(amountCents: string): Promise<Response> {
    return fetch(`${E2E_CONFIG.apiBaseUrl}/games/bet`, {
      method: "POST",
      headers: {
        ...this.authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountCents }),
    });
  }

  async cashOut(): Promise<CashOutResponse> {
    const response = await fetch(`${E2E_CONFIG.apiBaseUrl}/games/bet/cashout`, {
      method: "POST",
      headers: this.authHeaders(),
    });
    return expectJson<CashOutResponse>(response, 202);
  }

  async cashOutRaw(): Promise<Response> {
    return fetch(`${E2E_CONFIG.apiBaseUrl}/games/bet/cashout`, {
      method: "POST",
      headers: this.authHeaders(),
    });
  }

  findPlayerBetInRound(round: CurrentRound, playerId: string): BetSummary | undefined {
    return round.bets.find((bet) => bet.playerId === playerId);
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.accessToken}` };
  }
}
