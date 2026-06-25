import { ApiProperty } from "@nestjs/swagger";
import { Round } from "../../domain/entities/round.aggregate";
import { RoundStatus } from "../../domain/entities/round-status";
import { Multiplier } from "../../domain/value-objects/multiplier.vo";
import { BetResponseDto } from "./bet-response.dto";

export class RoundResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty()
  nonce!: number;

  @ApiProperty({ enum: ["BETTING", "RUNNING", "CRASHED"] })
  status!: string;

  @ApiProperty({ description: "Provably-fair commitment (published before bets)" })
  serverSeedHash!: string;

  @ApiProperty({
    nullable: true,
    description: "Revealed only after the round crashed",
  })
  serverSeed!: string | null;

  @ApiProperty({
    nullable: true,
    description: "Final crash multiplier; null until the round crashed",
    example: 2.37,
  })
  crashPoint!: number | null;

  @ApiProperty({
    description: "Current live multiplier (1.00 while betting / after crash use crashPoint)",
    example: 1.85,
  })
  liveMultiplier!: number;

  @ApiProperty()
  bettingEndsAt!: string;

  @ApiProperty({ nullable: true })
  startedAt!: string | null;

  @ApiProperty({ nullable: true })
  crashedAt!: string | null;

  @ApiProperty({ type: [BetResponseDto] })
  bets!: BetResponseDto[];

  static fromDomain(round: Round, liveMultiplier: Multiplier): RoundResponseDto {
    const crashed = round.getStatus() === RoundStatus.CRASHED;
    const dto = new RoundResponseDto();
    dto.id = round.id;
    dto.nonce = round.nonce;
    dto.status = round.getStatus();
    dto.serverSeedHash = round.serverSeedHash;

    dto.serverSeed = crashed ? round.serverSeed : null;
    dto.crashPoint = crashed ? round.crashPoint.toNumber() : null;

    dto.liveMultiplier = crashed
      ? round.crashPoint.toNumber()
      : liveMultiplier.toNumber();
    dto.bettingEndsAt = round.getBettingEndsAt().toISOString();
    dto.startedAt = round.getStartedAt()?.toISOString() ?? null;
    dto.crashedAt = round.getCrashedAt()?.toISOString() ?? null;
    dto.bets = round
      .getBets()
      .map((bet) => BetResponseDto.fromDomain(bet));
    return dto;
  }
}
