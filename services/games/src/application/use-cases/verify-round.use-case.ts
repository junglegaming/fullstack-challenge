import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { RoundStatus } from "../../domain/entities/round-status";
import { verifyRound } from "../../domain/services/provably-fair";
import { GameConfig } from "../game-config";
import { ROUND_REPOSITORY } from "../ports/round.repository";
import type { RoundRepository } from "../ports/round.repository";

export interface RoundVerification {
  roundId: string;
  nonce: number;
  status: RoundStatus;
  serverSeedHash: string;

  serverSeed: string | null;
  crashPoint: number | null;
  crashPointHundredths: number | null;
  formula: string;
  verification: { hashMatches: boolean; crashMatches: boolean; valid: boolean } | null;
}

@Injectable()
export class VerifyRoundUseCase {
  constructor(
    @Inject(ROUND_REPOSITORY) private readonly rounds: RoundRepository,
    private readonly config: GameConfig,
  ) {}

  async execute(roundId: string): Promise<RoundVerification> {
    const round = await this.rounds.findById(roundId);
    if (!round) {
      throw new NotFoundException(`Round ${roundId} not found`);
    }

    const revealed = round.getStatus() === RoundStatus.CRASHED;
    const formula =
      "crashPoint = floor( (1 - houseEdge) / (1 - X) * 100 ) / 100, " +
      "X = int(HMAC_SHA256(serverSeed, `crash:${nonce}`)[0..13]) / 2^52";

    if (!revealed) {
      return {
        roundId: round.id,
        nonce: round.nonce,
        status: round.getStatus(),
        serverSeedHash: round.serverSeedHash,
        serverSeed: null,
        crashPoint: null,
        crashPointHundredths: null,
        formula,
        verification: null,
      };
    }

    const verification = verifyRound({
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      nonce: round.nonce,
      crashPointHundredths: round.crashPoint.toHundredths(),
      houseEdge: this.config.houseEdge,
      maxHundredths: this.config.maxMultiplierHundredths,
    });

    return {
      roundId: round.id,
      nonce: round.nonce,
      status: round.getStatus(),
      serverSeedHash: round.serverSeedHash,
      serverSeed: round.serverSeed,
      crashPoint: round.crashPoint.toNumber(),
      crashPointHundredths: round.crashPoint.toHundredths(),
      formula,
      verification,
    };
  }
}
