import { Inject, Injectable } from "@nestjs/common";
import { Round } from "../../domain/entities/round.aggregate";
import { ROUND_REPOSITORY } from "../ports/round.repository";
import type { RoundRepository } from "../ports/round.repository";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetRoundHistoryUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly rounds: RoundRepository,
  ) {}

  async execute(page: number, limit: number): Promise<Paginated<Round>> {

    const offset = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.rounds.findHistory(limit, offset),
      this.rounds.countFinishedRounds(),
    ]);
    return { items, total, page, limit };
  }
}
