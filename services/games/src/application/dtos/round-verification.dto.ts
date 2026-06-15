import { Multiplier } from "../../domain/value-objects/multiplier";
import { HOUSE_EDGE_PERCENT, PROVABLY_FAIR_ALGORITHM } from "../../domain/constants/provably-fair";

export type RoundVerificationDto = {
  roundId: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  algorithm: string;
  houseEdgePercent: number;
  crashPoint: string;
};

export function toRoundVerificationDto(input: {
  roundId: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  crashPoint: Multiplier;
}): RoundVerificationDto {
  return {
    roundId: input.roundId,
    serverSeed: input.serverSeed,
    serverSeedHash: input.serverSeedHash,
    clientSeed: input.clientSeed,
    nonce: input.nonce,
    algorithm: PROVABLY_FAIR_ALGORITHM,
    houseEdgePercent: HOUSE_EDGE_PERCENT,
    crashPoint: input.crashPoint.toDecimalString(),
  };
}
