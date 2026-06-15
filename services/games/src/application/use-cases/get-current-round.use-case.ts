import type { GameRoundEngineConfig } from "../config/game-round-engine.config";
import { toCurrentRoundDto } from "../dtos/round-response.dto";
import type { CurrentRoundDto } from "../dtos/round-response.dto";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";

export class GetCurrentRoundUseCase {
  constructor(
    private readonly roundsRepository: GameRoundsRepository,
    private readonly engineConfig: Pick<GameRoundEngineConfig, "multiplierGrowth">,
  ) {}

  async execute(): Promise<CurrentRoundDto> {
    const round = await this.roundsRepository.findCurrent();
    return toCurrentRoundDto(round, {
      multiplierGrowth: this.engineConfig.multiplierGrowth,
    });
  }
}
