import { ApiProperty } from "@nestjs/swagger";

export class PlaceBetCommandDto {
  @ApiProperty({
    description: "Bet amount in cents (string-encoded integer)",
    example: "1000",
  })
  amountCents!: string;
}

export class PlaceBetResponseDto {
  @ApiProperty({ enum: ["PENDING"], example: "PENDING" })
  status!: "PENDING";

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  roundId!: string;

  @ApiProperty({ example: "bet:550e8400-e29b-41d4-a716-446655440000:player-1" })
  idempotencyKey!: string;
}

export class CashOutResponseDto {
  @ApiProperty({ enum: ["PENDING"], example: "PENDING" })
  status!: "PENDING";

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  roundId!: string;

  @ApiProperty({ description: "Multiplier at cash-out request time", example: "2.50" })
  currentMultiplier!: string;

  @ApiProperty({ description: "Estimated payout in cents", example: "2500" })
  estimatedPayoutCents!: string;

  @ApiProperty({ example: "cashout:550e8400-e29b-41d4-a716-446655440000:player-1" })
  idempotencyKey!: string;
}
