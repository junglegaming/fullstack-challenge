import { config } from "../config";
import { getAccessToken } from "./auth";

export type Wallet = {
  id: string;
  playerId: string;
  balanceCents: string;
  balanceFormatted: string;
};

export type BetSummary = {
  id: string;
  roundId: string;
  playerId?: string;
  username?: string;
  amountCents: string;
  status: string;
  cashOutMultiplier: string | null;
  payoutCents: string | null;
};

export type CurrentRound = {
  id: string;
  status: "BETTING" | "RUNNING" | "CRASHED" | "SETTLED";
  serverSeedHash: string;
  serverSeed?: string | null;
  bettingStartedAt: string;
  bettingEndsAt: string;
  startedAt: string | null;
  crashedAt: string | null;
  currentMultiplier: string;
  bets: BetSummary[];
};

export type RoundHistoryItem = {
  id: string;
  crashPoint: string;
  serverSeedHash: string;
  serverSeed: string | null;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type PendingAction = {
  status: "PENDING";
  roundId: string;
  idempotencyKey: string;
};

export type CashOutResult = PendingAction & {
  currentMultiplier: string;
  estimatedPayoutCents: string;
};

export type RoundVerification = {
  roundId: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  algorithm: string;
  houseEdgePercent: number;
  crashPoint: string;
};

export async function getWallet(): Promise<Wallet> {
  return request<Wallet>("/wallets/me", { auth: true });
}

export async function createWallet(): Promise<Wallet> {
  return request<Wallet>("/wallets", {
    method: "POST",
    auth: true,
  });
}

export async function getCurrentRound(): Promise<CurrentRound> {
  return request<CurrentRound>("/games/rounds/current");
}

export async function getRoundHistory(): Promise<Paginated<RoundHistoryItem>> {
  return request<Paginated<RoundHistoryItem>>("/games/rounds/history?pageSize=20");
}

export async function getRoundVerification(
  roundId: string,
): Promise<RoundVerification> {
  return request<RoundVerification>(`/games/rounds/${roundId}/verify`);
}

export async function getMyBets(): Promise<Paginated<BetSummary>> {
  return request<Paginated<BetSummary>>("/games/bets/me?pageSize=20", {
    auth: true,
  });
}

export async function placeBet(amountCents: string): Promise<PendingAction> {
  return request<PendingAction>("/games/bet", {
    method: "POST",
    auth: true,
    body: { amountCents },
  });
}

export async function cashOut(): Promise<CashOutResult> {
  return request<CashOutResult>("/games/bet/cashout", {
    method: "POST",
    auth: true,
  });
}

async function request<T>(
  path: string,
  options: {
    method?: string;
    auth?: boolean;
    body?: unknown;
  } = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.auth) {
    const token = getAccessToken();

    if (!token) {
      throw new Error("Login required");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json() as { message?: string; code?: string };
    return body.message ?? body.code ?? "Request failed";
  } catch {
    return "Request failed";
  }
}
