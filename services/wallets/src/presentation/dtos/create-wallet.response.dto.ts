import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNumber, IsDate } from "class-validator";
import { WalletId } from "@/domain/value-objects/wallet-id.vo";

export class CreateWalletResponseDto {
  @ApiProperty({ description: "Wallet ID", example: "123e4567-e89b-12d3-a456-426614174000" })
  @IsString()
  walletId: string;

  @ApiProperty({ description: "Player ID", example: "player-123" })
  @IsString()
  playerId: string;

  @ApiProperty({ description: "Initial balance in cents", example: 0 })
  @IsNumber()
  balance: number;

  @ApiProperty({ description: "Creation date" })
  @IsDate()
  createdAt: Date;

  constructor(walletId: string, playerId: string, balance: number, createdAt: Date) {
    this.walletId = walletId;
    this.playerId = playerId;
    this.balance = balance;
    this.createdAt = createdAt;
  }
}
