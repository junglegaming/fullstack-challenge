import {
  toRoundHistoryItemDto,
} from "../dtos/round-response.dto";
import type { PaginatedRoundHistoryDto } from "../dtos/round-response.dto";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";

export class GetRoundHistoryUseCase {
  constructor(private readonly roundsRepository: GameRoundsRepository) {}

  async execute(input: {
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedRoundHistoryDto> {
    const page = normalizePositiveInteger(input.page, 1);
    const pageSize = normalizePositiveInteger(input.pageSize, 20);
    const history = await this.roundsRepository.listHistory({ page, pageSize });

    return {
      items: history.items.map(toRoundHistoryItemDto),
      page,
      pageSize,
      total: history.total,
    };
  }
}

function normalizePositiveInteger(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isInteger(value) || value < 1) {
    return fallback;
  }

  return value;
}
