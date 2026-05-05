import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsDate } from "class-validator";

export class WalletBalanceResponseDto {
  @ApiProperty({ description: "Wallet ID", example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsString()
  walletId: string;

  @ApiProperty({ description: "Player ID", example: "player-123" })
  @IsString()
  playerId: string;

  @ApiProperty({ description: "Current balance in cents", example: 1000 })
  @IsNumber()
  balance: number;

  @ApiProperty({ description: "Last update date" })
  @IsDate()
  updatedAt: Date;

  constructor(walletId: string, playerId: string, balance: number, updatedAt: Date) {
    this.walletId = walletId;
    this.playerId = playerId;
    this.balance = balance;
    this.updatedAt = updatedAt;
  }
}
