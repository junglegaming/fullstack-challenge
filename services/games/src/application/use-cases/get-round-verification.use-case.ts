import { Round } from "../../domain/entities/round";
import { ProvablyFairService } from "../../domain/services/provably-fair.service";
import { RoundId } from "../../domain/value-objects/round-id";
import {
  toRoundVerificationDto,
} from "../dtos/round-verification.dto";
import type { RoundVerificationDto } from "../dtos/round-verification.dto";
import type { GameRoundsRepository } from "../ports/game-rounds.repository";

export class GetRoundVerificationUseCase {
  constructor(
    private readonly provablyFairService: ProvablyFairService,
    private readonly roundsRepository?: GameRoundsRepository,
  ) {}

  async execute(roundId: string): Promise<RoundVerificationDto> {
    if (!this.roundsRepository) {
      throw new Error("Game rounds repository is not configured");
    }

    const round = await this.roundsRepository.findById(RoundId.create(roundId));

    if (!round) {
      throw new Error(`Round ${roundId} not found`);
    }

    return this.executeFromRound(round);
  }

  executeFromRound(round: Round): RoundVerificationDto {
    const verification = round.toVerificationData(this.provablyFairService);

    const hashMatches =
      this.provablyFairService.hashServerSeed(verification.serverSeed) ===
      round.serverSeedHash;

    const crashPointMatches = verification.crashPoint.equals(round.crashPoint);

    if (!hashMatches || !crashPointMatches) {
      throw new Error("Round verification data is inconsistent");
    }

    return toRoundVerificationDto({
      roundId: round.id.toString(),
      serverSeed: verification.serverSeed,
      serverSeedHash: verification.serverSeedHash,
      clientSeed: verification.clientSeed,
      nonce: verification.nonce,
      crashPoint: verification.crashPoint,
    });
  }
}
