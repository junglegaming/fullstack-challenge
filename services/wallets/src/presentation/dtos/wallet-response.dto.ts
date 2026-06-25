import { ApiProperty } from "@nestjs/swagger";
import { Wallet } from "../../domain/entities/wallet.aggregate";

export class WalletResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ description: "Keycloak subject of the wallet owner" })
  playerId!: string;

  @ApiProperty({
    description: "Balance in integer cents (authoritative, never a float)",
    example: "1000000",
  })
  balanceCents!: string;

  @ApiProperty({
    description: "Balance formatted as decimal reais",
    example: "10000.00",
  })
  balance!: string;

  static fromDomain(wallet: Wallet): WalletResponseDto {
    const dto = new WalletResponseDto();
    dto.id = wallet.id;
    dto.playerId = wallet.playerId;
    dto.balanceCents = wallet.getBalance().toCents().toString();
    dto.balance = wallet.getBalance().toDecimalString();
    return dto;
  }
}
