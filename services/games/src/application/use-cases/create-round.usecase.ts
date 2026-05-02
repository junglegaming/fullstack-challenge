import { Round, RoundStatus } from "@/domain/entities/round.entity";
import { CrashService } from "@/domain/services/crash.service";
import { RoundRepository } from "@/infrastructure/repositories/round.repository";

export class CreateRoundUseCase {
  constructor(
    private crashService: CrashService,
    private roundRepo: RoundRepository,
  ) {}

  async execute() {
    const round = new Round(
      crypto.randomUUID(),
      RoundStatus.BETTING,
      this.crashService.generate(),
    );

    await this.roundRepo.save(round);

    return round;
  }
}