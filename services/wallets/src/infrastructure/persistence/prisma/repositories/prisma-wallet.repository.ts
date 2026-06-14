import { Injectable } from "@nestjs/common";
import { LedgerTransactionType } from "@prisma/client";
import { WalletRepository } from "../../../../application/ports/wallet.repository";
import { Wallet } from "../../../../domain/entities/wallet";
import { PlayerId } from "../../../../domain/value-objects/player-id";
import { WalletMapper } from "../mappers/wallet.mapper";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPlayerId(playerId: PlayerId): Promise<Wallet | null> {
    const record = await this.prisma.wallet.findUnique({
      where: { playerId: playerId.toString() },
    });

    if (!record) {
      return null;
    }

    return WalletMapper.toDomain(record);
  }

  async save(wallet: Wallet): Promise<void> {
    const data = WalletMapper.toPersistence(wallet);

    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.create({
        data: {
          id: data.id,
          playerId: data.playerId,
          balanceCents: data.balanceCents,
        },
      });

      if (wallet.balance.amountInCents > 0n) {
        await tx.ledgerTransaction.create({
          data: {
            walletId: data.id,
            idempotencyKey: `wallet-init-${data.id}`,
            type: LedgerTransactionType.CREDIT,
            amountCents: wallet.balance.amountInCents,
            balanceAfterCents: wallet.balance.amountInCents,
          },
        });
      }
    });
  }
}
