import type { BetSummary, CurrentRound, Wallet } from "../services/api";

export const mockWallet: Wallet = {
  id: "wallet-1",
  playerId: "player-1",
  balanceCents: "100000",
  balanceFormatted: "1000.00",
};

export const mockBettingRound: CurrentRound = {
  id: "round-1",
  status: "BETTING",
  serverSeedHash: "seed-hash",
  bettingStartedAt: "2026-01-01T00:00:00.000Z",
  bettingEndsAt: "2026-01-01T00:00:30.000Z",
  startedAt: null,
  crashedAt: null,
  currentMultiplier: "1.00",
  bets: [],
};

export const mockRunningRound: CurrentRound = {
  ...mockBettingRound,
  status: "RUNNING",
  startedAt: "2026-01-01T00:00:30.000Z",
  currentMultiplier: "2.50",
};

export const mockPlacedBet: BetSummary = {
  id: "bet-1",
  roundId: "round-1",
  playerId: "player-1",
  amountCents: "1000",
  status: "PLACED",
  cashOutMultiplier: null,
  payoutCents: null,
};
