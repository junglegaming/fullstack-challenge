import { Inject, Injectable } from "@nestjs/common";
import { Bet } from "../../domain/entities/bet.entity";
import { ROUND_REPOSITORY } from "../ports/round.repository";
import type { RoundRepository } from "../ports/round.repository";
import { Paginated } from "./get-round-history.use-case";

@Injectable()
export class GetMyBetsUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly rounds: RoundRepository,
  ) {}

  async execute(
    playerId: string,
    page: number,
    limit: number,
  ): Promise<Paginated<Bet>> {

    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.rounds.findBetsByPlayer(playerId, limit, offset),
      this.rounds.countBetsByPlayer(playerId),
    ]);
    return { items, total, page, limit };
  }
}
