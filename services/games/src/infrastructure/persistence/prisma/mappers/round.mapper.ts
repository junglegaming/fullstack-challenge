import type { Bet as PrismaBet, Round as PrismaRound } from "@prisma/client";
import { Round } from "../../../../domain/entities/round";
import { RoundStatus } from "../../../../domain/value-objects/round-status";
import { Multiplier } from "../../../../domain/value-objects/multiplier";
import { RoundId } from "../../../../domain/value-objects/round-id";
import { BetMapper } from "./bet.mapper";

export type RoundWithBetsRecord = PrismaRound & {
  bets: PrismaBet[];
};

export class RoundMapper {
  static toDomain(record: RoundWithBetsRecord): Round {
    const isServerSeedRevealed =
      record.status === RoundStatus.CRASHED ||
      record.status === RoundStatus.SETTLED;

    return Round.reconstitute({
      id: RoundId.create(record.id),
      status: record.status as RoundStatus,
      serverSeedHash: record.serverSeedHash,
      serverSeed: isServerSeedRevealed ? record.serverSeed : null,
      hiddenServerSeed: isServerSeedRevealed ? null : record.serverSeed,
      clientSeed: record.clientSeed,
      nonce: record.nonce,
      crashPoint: Multiplier.fromBasisPoints(record.crashPointBps),
      bettingStartedAt: record.createdAt,
      bettingEndsAt: record.bettingEndsAt,
      startedAt: record.startedAt,
      crashedAt: record.crashedAt,
      settledAt: record.settledAt,
      bets: record.bets.map(BetMapper.toDomain),
    });
  }

  static toPersistenceCreate(round: Round): PrismaRound {
    return {
      id: round.id.toString(),
      status: round.status as PrismaRound["status"],
      serverSeedHash: round.serverSeedHash,
      serverSeed: round.getStoredServerSeed(),
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      crashPointBps: round.crashPoint.valueInBasisPoints,
      bettingEndsAt: round.bettingEndsAt,
      startedAt: round.startedAt,
      crashedAt: round.crashedAt,
      settledAt: round.settledAt,
      createdAt: round.bettingStartedAt,
      updatedAt: new Date(),
    };
  }

  static toPersistenceUpdate(round: Round): Omit<
    PrismaRound,
    "id" | "createdAt"
  > {
    return {
      status: round.status as PrismaRound["status"],
      serverSeedHash: round.serverSeedHash,
      serverSeed: round.getStoredServerSeed(),
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      crashPointBps: round.crashPoint.valueInBasisPoints,
      bettingEndsAt: round.bettingEndsAt,
      startedAt: round.startedAt,
      crashedAt: round.crashedAt,
      settledAt: round.settledAt,
      updatedAt: new Date(),
    };
  }
}
