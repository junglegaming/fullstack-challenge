import { Bet } from "../../domain/entities/bet";
import { Round } from "../../domain/entities/round";

export type BetSummaryDto = {
  id: string;
  roundId: string;
  playerId: string;
  username: string;
  amountCents: string;
  status: string;
  cashOutMultiplier: string | null;
  payoutCents: string | null;
};

export type CurrentRoundDto = {
  id: string;
  status: string;
  serverSeedHash: string;
  bettingStartedAt: string;
  bettingEndsAt: string;
  startedAt: string | null;
  crashedAt: string | null;
  currentMultiplier: string;
  bets: BetSummaryDto[];
};

export type RoundHistoryItemDto = {
  id: string;
  crashPoint: string;
  serverSeedHash: string;
  serverSeed: string | null;
  createdAt: string;
};

export type PaginatedRoundHistoryDto = {
  items: RoundHistoryItemDto[];
  page: number;
  pageSize: number;
  total: number;
};

export function toBetSummaryDto(bet: Bet): BetSummaryDto {
  const playerId = bet.playerId.toString();

  return {
    id: bet.id.toString(),
    roundId: bet.roundId.toString(),
    playerId,
    username: playerId,
    amountCents: bet.amount.amountInCents.toString(),
    status: bet.status,
    cashOutMultiplier: bet.cashOutMultiplier?.toDecimalString() ?? null,
    payoutCents: bet.payout?.amountInCents.toString() ?? null,
  };
}

export function toCurrentRoundDto(round: Round): CurrentRoundDto {
  return {
    id: round.id.toString(),
    status: round.status,
    serverSeedHash: round.serverSeedHash,
    bettingStartedAt: round.bettingStartedAt.toISOString(),
    bettingEndsAt: round.bettingEndsAt.toISOString(),
    startedAt: round.startedAt?.toISOString() ?? null,
    crashedAt: round.crashedAt?.toISOString() ?? null,
    currentMultiplier: round.getCurrentMultiplier(new Date()).toDecimalString(),
    bets: round.bets.map(toBetSummaryDto),
  };
}

export function toRoundHistoryItemDto(round: Round): RoundHistoryItemDto {
  return {
    id: round.id.toString(),
    crashPoint: round.crashPoint.toDecimalString(),
    serverSeedHash: round.serverSeedHash,
    serverSeed: round.serverSeed,
    createdAt: round.bettingStartedAt.toISOString(),
  };
}

