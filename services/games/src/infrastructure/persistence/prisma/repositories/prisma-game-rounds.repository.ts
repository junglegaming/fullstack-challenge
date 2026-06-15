import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import {
  GAME_ROUND_ENGINE_CONFIG,
  type GameRoundEngineConfig,
} from "../../../../application/config/game-round-engine.config";
import type {
  GameRoundsRepository,
  RoundHistoryPage,
} from "../../../../application/ports/game-rounds.repository";
import { Bet } from "../../../../domain/entities/bet";
import { Round } from "../../../../domain/entities/round";
import { ProvablyFairService } from "../../../../domain/services/provably-fair.service";
import { PlayerId } from "../../../../domain/value-objects/player-id";
import { RoundId } from "../../../../domain/value-objects/round-id";
import { RoundStatus } from "../../../../domain/value-objects/round-status";
import { seedGameRoundsIfEmpty } from "../game-rounds.seed";
import { BetMapper } from "../mappers/bet.mapper";
import { RoundMapper } from "../mappers/round.mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaGameRoundsRepository
  implements GameRoundsRepository, OnModuleInit
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly provablyFairService: ProvablyFairService,
    @Inject(GAME_ROUND_ENGINE_CONFIG)
    private readonly config: GameRoundEngineConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    await seedGameRoundsIfEmpty(
      this.prisma,
      this.provablyFairService,
      this.config,
    );
  }

  async findCurrent(): Promise<Round> {
    const record = await this.prisma.round.findFirst({
      include: { bets: true },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw new Error("No current round found");
    }

    return RoundMapper.toDomain(record);
  }

  async findById(roundId: RoundId): Promise<Round | null> {
    const record = await this.prisma.round.findUnique({
      where: { id: roundId.toString() },
      include: { bets: true },
    });

    if (!record) {
      return null;
    }

    return RoundMapper.toDomain(record);
  }

  async listHistory(input: {
    page: number;
    pageSize: number;
  }): Promise<RoundHistoryPage> {
    const currentRound = await this.prisma.round.findFirst({
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });

    if (!currentRound) {
      return { items: [], total: 0 };
    }

    const where = {
      status: RoundStatus.SETTLED,
      createdAt: {
        lt: currentRound.createdAt,
      },
    };

    const [records, total] = await this.prisma.$transaction([
      this.prisma.round.findMany({
        where,
        include: { bets: true },
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.round.count({ where }),
    ]);

    return {
      items: records.map(RoundMapper.toDomain),
      total,
    };
  }

  async findBetsByPlayer(playerId: PlayerId): Promise<Bet[]> {
    const records = await this.prisma.bet.findMany({
      where: { playerId: playerId.toString() },
      orderBy: { createdAt: "desc" },
    });

    return records.map(BetMapper.toDomain);
  }

  async save(round: Round): Promise<void> {
    const roundCreate = RoundMapper.toPersistenceCreate(round);
    const roundUpdate = RoundMapper.toPersistenceUpdate(round);

    await this.prisma.$transaction(async (tx) => {
      await tx.round.upsert({
        where: { id: roundCreate.id },
        create: roundCreate,
        update: roundUpdate,
      });

      for (const bet of round.bets) {
        const betCreate = BetMapper.toPersistence(bet);
        const betUpdate = BetMapper.toPersistenceUpdate(bet);

        await tx.bet.upsert({
          where: { id: betCreate.id },
          create: betCreate,
          update: betUpdate,
        });
      }
    });
  }

  async archiveCurrentAndStart(nextRound: Round): Promise<void> {
    await this.save(nextRound);
  }
}
