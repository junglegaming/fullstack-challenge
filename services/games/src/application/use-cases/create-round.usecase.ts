import { Injectable, Inject } from "@nestjs/common";
import { Round } from "@/domain/entities/round.entity";
import { RoundStatus } from "@/domain/enums/round-status.enum";
import { CrashService } from "@/domain/services/crash.service";
import type { RoundRepository } from "@/infrastructure/repositories/round.repository";
import { Multiplier } from "@/domain/value-objects/multiplier.vo";
import { RoundId } from "@/domain/value-objects/round-id.vo";

@Injectable()
export class CreateRoundUseCase {
  constructor(
    private crashService: CrashService,
    @Inject('RoundRepository') private roundRepo: RoundRepository,
  ) {}

  async execute() {
    const roundId = new RoundId(crypto.randomUUID());
    const crashPoint = new Multiplier(this.crashService.generate());
    const round = new Round(
      roundId,
      RoundStatus.BETTING,
      crashPoint,
    );

    await this.roundRepo.save(round);

    return round;
  }
}