import { toCurrentRoundDto } from "../dtos/round-response.dto";
import type { CurrentRoundDto } from "../dtos/round-response.dto";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";

export class GetCurrentRoundUseCase {
  constructor(private readonly roundsRepository: GameRoundsRepository) {}

  async execute(): Promise<CurrentRoundDto> {
    const round = await this.roundsRepository.findCurrent();
    return toCurrentRoundDto(round);
  }
}
