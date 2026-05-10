
import { IRoundRepository } from "../../domain/repositories/IRoundRepository";
import { StartRoundUseCaseDTO } from "../dtos/round.dto";

export class StartRoundUseCase {
  constructor(private roundRepository: IRoundRepository) {}

  async execute(dto: StartRoundUseCaseDTO): Promise<void> {
    const round = await this.roundRepository.findActiveRound();

    if (!round) {
      throw new Error("Não existe uma rodada em fase de apostas para iniciar");
    }

    round.startRound();

    await this.roundRepository.saveRound(round);
  }
}
