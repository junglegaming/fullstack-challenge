import { ApiProperty } from "@nestjs/swagger";
import { Wallet } from "../../domain/entities/wallet";

export class WalletResponseDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  id!: string;

  @ApiProperty({ example: "player-1" })
  playerId!: string;

  @ApiProperty({ description: "Balance in cents (string-encoded integer)", example: "100000" })
  balanceCents!: string;

  @ApiProperty({ example: "1,000.00" })
  balanceFormatted!: string;
}

export function toWalletResponseDto(wallet: Wallet): WalletResponseDto {
  return {
    id: wallet.id.toString(),
    playerId: wallet.playerId.toString(),
    balanceCents: wallet.balance.amountInCents.toString(),
    balanceFormatted: wallet.balance.toDisplayString(),
  };
}
