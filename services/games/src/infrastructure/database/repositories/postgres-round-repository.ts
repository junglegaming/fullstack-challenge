import { Round } from "@/domain/entities/Round";
import {
  IRoundRepository,
  RoundProps,
} from "@/domain/repositories/IRoundRepository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PostgresRoundRepository implements IRoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveRound(): Promise<Round | null> {
    const roundData = await this.prisma.round.findFirst({
      where: {
        status: { not: "CRASHED" },
      },
      orderBy: { startTime: "desc" },
    });

    if (!roundData) return null;

    return Round.reconstitute({
      id: roundData.id,
      status: roundData.status as RoundProps["status"],
      crashPoint: Number(roundData.crashPoint),
      startTime: roundData.startTime,
      endTime: roundData.endTime,
      serverSeed: roundData.serverSeed,
      serverSeedHash: roundData.serverSeedHash,
      clientSeed: roundData.clientSeed,
      nonce: roundData.nonce,
    });
  }

  async saveRound(round: Round): Promise<void> {
    const data = round.toPersistence();
    await this.prisma.round.upsert({
      where: { id: data.id },
      update: {
        status: data.status as any,
        crashPoint: data.crashPoint,
        startTime: data.startTime,
        endTime: data.endTime,
        serverSeed: data.serverSeed,
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      },
      create: {
        id: data.id,
        status: data.status as any,
        crashPoint: data.crashPoint,
        startTime: data.startTime,
        endTime: data.endTime,
        serverSeed: data.serverSeed,
        serverSeedHash: data.serverSeedHash,
        clientSeed: data.clientSeed,
        nonce: data.nonce,
      },
    });
  }

  async findHistory(): Promise<Round[]> {
    const roundsData = await this.prisma.round.findMany({
      orderBy: { startTime: "desc" },
      take: 20,
    });

    return roundsData.map((roundData) =>
      Round.reconstitute({
        id: roundData.id,
        status: roundData.status as RoundProps["status"],
        crashPoint: Number(roundData.crashPoint),
        startTime: roundData.startTime,
        endTime: roundData.endTime,
        serverSeed: roundData.serverSeed,
        serverSeedHash: roundData.serverSeedHash,
        clientSeed: roundData.clientSeed,
        nonce: roundData.nonce,
      }),
    );
  }
  async findTopPlayers(limit: number): Promise<any[]> {
    return await this.prisma.bet.findMany({
      where: { status: "WON" },
      orderBy: { amount: "desc" },
      take: limit,
    });
  }
  async findCurrentNonce(): Promise<number> {
    const lastRound = await this.prisma.round.findFirst({
      orderBy: { nonce: "desc" },
    });

    return lastRound ? lastRound.nonce + 1 : 0;
  }
  async findById(roundId: string): Promise<Round | null> {
    const roundData = await this.prisma.round.findUnique({
      where: { id: roundId },
    });

    if (!roundData) return null;

    return Round.reconstitute({
      id: roundData.id,
      status: roundData.status as RoundProps["status"],
      crashPoint: Number(roundData.crashPoint),
      startTime: roundData.startTime,
      endTime: roundData.endTime,
      serverSeed: roundData.serverSeed,
      serverSeedHash: roundData.serverSeedHash,
      clientSeed: roundData.clientSeed,
      nonce: roundData.nonce,
    });
  }
}
