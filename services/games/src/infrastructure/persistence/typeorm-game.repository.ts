import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Round, RoundState } from "../../domain/round";
import { Bet, BetStatus } from "../../domain/bet";
import { Money } from "../../domain/money";
import { RoundOrmEntity } from "./round.orm-entity";
import { BetOrmEntity } from "./bet.orm-entity";

@Injectable()
export class TypeOrmGameRepository {
  constructor(
    @InjectRepository(RoundOrmEntity)
    private readonly rounds: Repository<RoundOrmEntity>,
    @InjectRepository(BetOrmEntity)
    private readonly bets: Repository<BetOrmEntity>,
  ) {}

  async saveRound(round: Round): Promise<void> {
    await this.rounds.save({
      id: round.id,
      state: round.state,
      seed: round.seed,
      hash: round.hash,
      crashPoint: round.crashPoint,
      startedAt: round.startedAt,
    });
  }

  async saveBet(bet: Bet, roundId: string): Promise<void> {
    await this.bets.save({
      id: bet.id,
      playerId: bet.playerId,
      amountCents: bet.amount.cents.toString(),
      status: bet.status,
      payoutCents: bet.payout?.cents.toString() ?? null,
      round: { id: roundId },
    });
  }

  async findRoundById(id: string): Promise<Round | null> {
    const orm = await this.rounds.findOne({
      where: { id },
      relations: { bets: true },
    });
    return orm ? this.roundToDomain(orm) : null;
  }

  async findCompletedRounds(
    page: number,
    limit: number,
  ): Promise<{ data: Round[]; total: number }> {
    const [items, total] = await this.rounds.findAndCount({
      where: { state: RoundState.CRASHED },
      relations: { bets: true },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: items.map((r) => this.roundToDomain(r)), total };
  }

  async findBetsByPlayerId(playerId: string): Promise<Bet[]> {
    const items = await this.bets.find({
      where: { playerId },
      relations: { round: true },
      order: { round: { createdAt: "DESC" } },
    });
    return items.map((b) => this.betToDomain(b));
  }

  private roundToDomain(orm: RoundOrmEntity): Round {
    const bets = (orm.bets ?? []).map((b) => this.betToDomain(b));
    return Round.reconstitute(
      orm.id,
      orm.state,
      orm.seed,
      orm.hash,
      orm.crashPoint,
      orm.startedAt,
      bets,
    );
  }

  private betToDomain(orm: BetOrmEntity): Bet {
    return Bet.reconstitute(
      orm.id,
      orm.round?.id ?? "",
      orm.playerId,
      Money.fromCents(Number(orm.amountCents)),
      orm.status as BetStatus,
      orm.payoutCents !== null ? Money.fromCents(Number(orm.payoutCents)) : null,
    );
  }
}
