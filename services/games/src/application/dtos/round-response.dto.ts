import { ApiProperty } from "@nestjs/swagger";
import { Bet } from "../../domain/entities/bet";
import { Round } from "../../domain/entities/round";
import type { MultiplierGrowthConfig } from "../../domain/services/multiplier-growth";
import { toMultiplierGrowthPayload } from "../mappers/multiplier-growth.mapper";
import type { MultiplierGrowthPayload } from "../realtime/game-realtime-events";

export class BetSummaryDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "660e8400-e29b-41d4-a716-446655440001" })
  roundId!: string;

  @ApiProperty({ example: "player-1" })
  playerId!: string;

  @ApiProperty({ example: "player-1" })
  username!: string;

  @ApiProperty({ example: "1000" })
  amountCents!: string;

  @ApiProperty({ example: "PLACED" })
  status!: string;

  @ApiProperty({ nullable: true, example: "2.50" })
  cashOutMultiplier!: string | null;

  @ApiProperty({ nullable: true, example: "2500" })
  payoutCents!: string | null;

  @ApiProperty({ nullable: true, example: "SETTLED" })
  payoutSettlementStatus!: string | null;

  @ApiProperty({ nullable: true, example: null })
  payoutSettlementFailureReason!: string | null;
}

export class CurrentRoundDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "BETTING" })
  status!: string;

  @ApiProperty({ example: "a3f2c1b0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3" })
  serverSeedHash!: string;

  @ApiProperty({ example: "2026-06-15T12:00:00.000Z" })
  bettingStartedAt!: string;

  @ApiProperty({ example: "2026-06-15T12:00:05.000Z" })
  bettingEndsAt!: string;

  @ApiProperty({ nullable: true, example: "2026-06-15T12:00:05.000Z" })
  startedAt!: string | null;

  @ApiProperty({ nullable: true, example: null })
  crashedAt!: string | null;

  @ApiProperty({ example: "1.00" })
  currentMultiplier!: string;

  @ApiProperty({ example: "1.00" })
  baseMultiplier!: string;

  @ApiProperty({
    example: {
      growthBasisPointsPerSecond: 40,
    },
  })
  multiplierGrowth!: MultiplierGrowthPayload;

  @ApiProperty({ nullable: true, example: "2026-06-15T12:00:05.000Z" })
  serverTime!: string | null;

  @ApiProperty({ type: [BetSummaryDto] })
  bets!: BetSummaryDto[];
}

export class RoundHistoryItemDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "2.45" })
  crashPoint!: string;

  @ApiProperty({ example: "a3f2c1b0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3" })
  serverSeedHash!: string;

  @ApiProperty({ nullable: true, example: "revealed-server-seed" })
  serverSeed!: string | null;

  @ApiProperty({ example: "2026-06-15T12:00:00.000Z" })
  createdAt!: string;
}

export class PaginatedRoundHistoryDto {
  @ApiProperty({ type: [RoundHistoryItemDto] })
  items!: RoundHistoryItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 100 })
  total!: number;
}

export class PaginatedPlayerBetsDto {
  @ApiProperty({ type: [BetSummaryDto] })
  items!: BetSummaryDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 5 })
  total!: number;
}

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
    payoutSettlementStatus: bet.payoutSettlementStatus,
    payoutSettlementFailureReason: bet.payoutSettlementFailureReason,
  };
}

export function toCurrentRoundDto(
  round: Round,
  input?: { multiplierGrowth?: MultiplierGrowthConfig },
): CurrentRoundDto {
  const now = new Date();
  const multiplierGrowth = input?.multiplierGrowth ?? {
    growthBasisPointsPerSecond: 100,
  };

  return {
    id: round.id.toString(),
    status: round.status,
    serverSeedHash: round.serverSeedHash,
    bettingStartedAt: round.bettingStartedAt.toISOString(),
    bettingEndsAt: round.bettingEndsAt.toISOString(),
    startedAt: round.startedAt?.toISOString() ?? null,
    crashedAt: round.crashedAt?.toISOString() ?? null,
    currentMultiplier: round
      .getCurrentMultiplier(now, { growthConfig: multiplierGrowth })
      .toDecimalString(),
    baseMultiplier: "1.00",
    multiplierGrowth: toMultiplierGrowthPayload(multiplierGrowth),
    serverTime: round.status === "RUNNING" ? now.toISOString() : null,
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
