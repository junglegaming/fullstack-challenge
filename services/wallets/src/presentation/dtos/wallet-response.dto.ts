import { Wallet } from "../../domain/entities/wallet";

export type WalletResponseDto = {
  id: string;
  playerId: string;
  balanceCents: string;
  balanceFormatted: string;
};

export function toWalletResponseDto(wallet: Wallet): WalletResponseDto {
  return {
    id: wallet.id.toString(),
    playerId: wallet.playerId.toString(),
    balanceCents: wallet.balance.amountInCents.toString(),
    balanceFormatted: wallet.balance.toDisplayString(),
  };
}
