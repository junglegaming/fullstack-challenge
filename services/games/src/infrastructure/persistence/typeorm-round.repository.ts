import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Bet } from "../../domain/entities/bet.entity";
import { Round } from "../../domain/entities/round.aggregate";
import { RoundStatus } from "../../domain/entities/round-status";
import type { RoundRepository } from "../../application/ports/round.repository";
import { BetOrmEntity } from "./bet.orm-entity";
import { GameMapper } from "./game.mapper";
import { RoundOrmEntity } from "./round.orm-entity";

@Injectable()
export class TypeOrmRoundRepository implements RoundRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async save(round: Round): Promise<void> {
    const roundRow = GameMapper.roundToOrm(round);
    const betRows = round.getBets().map((bet) => GameMapper.betToOrm(bet));
    await this.dataSource.transaction(async (manager) => {
      await manager.save(RoundOrmEntity, roundRow);
      if (betRows.length > 0) {
        await manager.save(BetOrmEntity, betRows);
      }
    });
  }

  async findById(id: string): Promise<Round | null> {
    const row = await this.dataSource
      .getRepository(RoundOrmEntity)
      .findOne({ where: { id }, relations: { bets: true } });
    return row ? GameMapper.roundToDomain(row) : null;
  }

  async findHistory(limit: number, offset: number): Promise<Round[]> {
    const rows = await this.dataSource.getRepository(RoundOrmEntity).find({
      where: { status: RoundStatus.CRASHED },
      relations: { bets: true },
      order: { nonce: "DESC" },
      take: limit,
      skip: offset,
    });
    return rows.map((row) => GameMapper.roundToDomain(row));
  }

  async countFinishedRounds(): Promise<number> {
    return this.dataSource
      .getRepository(RoundOrmEntity)
      .count({ where: { status: RoundStatus.CRASHED } });
  }

  async findMaxNonce(): Promise<number | null> {
    const result = await this.dataSource
      .getRepository(RoundOrmEntity)
      .createQueryBuilder("round")
      .select("MAX(round.nonce)", "max")
      .getRawOne<{ max: number | null }>();
    return result?.max ?? null;
  }

  async findBetsByPlayer(
    playerId: string,
    limit: number,
    offset: number,
  ): Promise<Bet[]> {
    const rows = await this.dataSource.getRepository(BetOrmEntity).find({
      where: { playerId },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });
    return rows.map((row) => GameMapper.betToDomain(row));
  }

  async countBetsByPlayer(playerId: string): Promise<number> {
    return this.dataSource
      .getRepository(BetOrmEntity)
      .count({ where: { playerId } });
  }
}
