import { IRoundRepository } from "../../domain/repositories/IRoundRepository";

export class CrashRoundUseCase {
  constructor(
    private roundRepository: IRoundRepository,
  ) {}

  async execute(): Promise<void> {
    const round = await this.roundRepository.findActiveRound();

    if (!round || round.status !== "RUNNING") {
      throw new Error("Não há rodada ativa para sofrer crash");
    }

    round.crash();
    await this.roundRepository.saveRound(round);
  }
}
