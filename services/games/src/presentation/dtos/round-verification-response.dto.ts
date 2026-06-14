/**
 * Response shape for GET /games/rounds/:roundId/verify
 * @see specs/02-api-contract.md and specs/04-provably-fair.md
 */
export type RoundVerificationResponseDto = {
  roundId: string;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  algorithm: string;
  houseEdgePercent: number;
  crashPoint: string;
};
