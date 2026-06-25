import { ApiProperty } from "@nestjs/swagger";
import { Bet } from "../../domain/entities/bet.entity";
import { Money } from "../../domain/value-objects/money.vo";

export class BetResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  roundId!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ example: "1000" })
  amountCents!: string;

  @ApiProperty({ example: "10.00" })
  amount!: string;

  @ApiProperty({
    enum: ["PENDING", "ACTIVE", "REJECTED", "CASHED_OUT", "LOST"],
  })
  status!: string;

  @ApiProperty({ nullable: true, example: 2.37 })
  cashOutMultiplier!: number | null;

  @ApiProperty({ nullable: true, example: "2370" })
  payoutCents!: string | null;

  @ApiProperty({ nullable: true, example: "23.70" })
  payout!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ nullable: true })
  settledAt!: string | null;

  static fromDomain(bet: Bet): BetResponseDto {
    const dto = new BetResponseDto();
    dto.id = bet.id;
    dto.roundId = bet.roundId;
    dto.username = bet.username;
    dto.amountCents = bet.amount.toCents().toString();
    dto.amount = bet.amount.toDecimalString();
    dto.status = bet.getStatus();

    const multiplier = bet.getCashOutMultiplier();
    dto.cashOutMultiplier = multiplier ? multiplier.toNumber() : null;
    const payout: Money | null = bet.getPayout();
    dto.payoutCents = payout ? payout.toCents().toString() : null;
    dto.payout = payout ? payout.toDecimalString() : null;
    dto.createdAt = bet.createdAt.toISOString();
    const settledAt = bet.getSettledAt();
    dto.settledAt = settledAt ? settledAt.toISOString() : null;
    return dto;
  }
}
