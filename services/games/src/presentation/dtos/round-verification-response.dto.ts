import { ApiProperty } from "@nestjs/swagger";

/**
 * Response shape for GET /games/rounds/:roundId/verify
 * @see specs/02-api-contract.md and specs/04-provably-fair.md
 */
export class RoundVerificationResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  roundId!: string;

  @ApiProperty({ example: "revealed-server-seed" })
  serverSeed!: string;

  @ApiProperty({ example: "a3f2c1b0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3" })
  serverSeedHash!: string;

  @ApiProperty({ example: "client-seed" })
  clientSeed!: string;

  @ApiProperty({ example: 1 })
  nonce!: number;

  @ApiProperty({ example: "sha256-hmac" })
  algorithm!: string;

  @ApiProperty({ example: 3 })
  houseEdgePercent!: number;

  @ApiProperty({ example: "2.45" })
  crashPoint!: string;
}
