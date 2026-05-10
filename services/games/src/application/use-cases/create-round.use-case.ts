import { Round } from "@/domain/entities/Round";
import { IRoundRepository } from "@/domain/repositories/IRoundRepository";

export class CreateRoundUseCase {
  constructor(private roundRepository: IRoundRepository) {}

  async execute(clientSeed: string): Promise<void> {
    const nonce = await this.roundRepository.findCurrentNonce();

    const round = Round.create(clientSeed, nonce);

    await this.roundRepository.saveRound(round);
  }
}
