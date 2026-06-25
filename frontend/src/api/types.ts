export type RoundStatus = "BETTING" | "RUNNING" | "CRASHED";

export type BetStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "CASHED_OUT"
  | "LOST";

export interface BetDto {
  id: string;
  roundId: string;
  username: string;
  amountCents: string;
  amount: string;
  status: BetStatus;
  cashOutMultiplier: number | null;
  payoutCents: string | null;
  payout: string | null;
  createdAt: string;
  settledAt: string | null;
}

export interface RoundDto {
  id: string;
  nonce: number;
  status: RoundStatus;
  serverSeedHash: string;
  serverSeed: string | null;
  crashPoint: number | null;
  liveMultiplier: number;
  bettingEndsAt: string;
  startedAt: string | null;
  crashedAt: string | null;
  bets: BetDto[];
}

export interface WalletDto {
  id: string;
  playerId: string;
  balanceCents: string;
  balance: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface RoundVerification {
  roundId: string;
  nonce: number;
  status: RoundStatus;
  serverSeedHash: string;
  serverSeed: string | null;
  crashPoint: number | null;
  crashPointHundredths: number | null;
  formula: string;
  verification: {
    hashMatches: boolean;
    crashMatches: boolean;
    valid: boolean;
  } | null;
}
