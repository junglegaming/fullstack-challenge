import { API_URL } from "../config";
import type {
  BetDto,
  Paginated,
  RoundDto,
  RoundVerification,
  WalletDto,
} from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let tokenProvider: () => Promise<string | null> = async () => null;

export function setTokenProvider(fn: () => Promise<string | null>): void {
  tokenProvider = fn;
}

interface RequestOptions {
  auth?: boolean;
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { auth = false, method = "GET", body, query } = opts;

  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined) {
        url.searchParams.set(key, String(val));
      }
    }
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = await tokenProvider();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await extractError(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = (await res.clone().json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(", ");
    }
    if (data.message) {
      return data.message;
    }
  } catch {
    /* não é JSON */
  }
  return `A requisição falhou (${res.status})`;
}

export const api = {
  getCurrentRound: () =>
    request<RoundDto | null>("/games/rounds/current"),

  getHistory: (page = 1, limit = 15) =>
    request<Paginated<RoundDto>>("/games/rounds/history", {
      query: { page, limit },
    }),

  verifyRound: (roundId: string) =>
    request<RoundVerification>(`/games/rounds/${roundId}/verify`),

  getMyBets: (page = 1, limit = 15) =>
    request<Paginated<BetDto>>("/games/bets/me", {
      auth: true,
      query: { page, limit },
    }),

  placeBet: (amount: string) =>
    request<BetDto>("/games/bet", {
      auth: true,
      method: "POST",
      body: { amount },
    }),

  cashOut: () =>
    request<BetDto>("/games/bet/cashout", { auth: true, method: "POST" }),

  getWallet: () => request<WalletDto>("/wallets/me", { auth: true }),
};
