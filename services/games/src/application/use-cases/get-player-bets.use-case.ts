import { toBetSummaryDto, type PaginatedPlayerBetsDto } from "../dtos/round-response.dto";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";
import { PlayerId } from "../../domain/value-objects/player-id";

export type { PaginatedPlayerBetsDto };

export class GetPlayerBetsUseCase {
  constructor(private readonly roundsRepository: GameRoundsRepository) {}

  async execute(input: {
    playerId: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedPlayerBetsDto> {
    const page = normalizePositiveInteger(input.page, 1);
    const pageSize = normalizePositiveInteger(input.pageSize, 20);
    const bets = await this.roundsRepository.findBetsByPlayer(
      PlayerId.create(input.playerId),
    );
    const start = (page - 1) * pageSize;

    return {
      items: bets.slice(start, start + pageSize).map(toBetSummaryDto),
      page,
      pageSize,
      total: bets.length,
    };
  }
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}
