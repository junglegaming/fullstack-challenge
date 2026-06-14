import { Round } from "../../domain/entities/round";
import { ProvablyFairService } from "../../domain/services/provably-fair.service";
import {
  RoundVerificationDto,
  toRoundVerificationDto,
} from "../dtos/round-verification.dto";

export class GetRoundVerificationUseCase {
  constructor(private readonly provablyFairService: ProvablyFairService) {}

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
