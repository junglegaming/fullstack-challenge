import { Wallet } from "@/domain/entities/wallet";
import { IWalletRepository } from "@/domain/repositories/wallet-repository.interface";
import { Money } from "@/domain/value-objects/Money";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PostgresWalletRepository implements IWalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Wallet | null> {
    const walletData = await this.prisma.wallet.findUnique({
      where: { userId: userId },
    });

    if (!walletData) {
      return null;
    }

    return new Wallet({
      userId: walletData.userId,
      balance: Money.fromCents(walletData.balance),
      updatedAt: walletData.UpdatedAt,
    });
  }

  async save(wallet: Wallet): Promise<void> {
    await this.prisma.wallet.update({
      where: { userId: wallet.userId },
      data: {
        balance: wallet.balance.cents,
        UpdatedAt: new Date(),
      },
    });
  }

  async create(wallet: Wallet): Promise<void> {
    await this.prisma.wallet.create({
      data: {
        userId: wallet.userId,
        balance: wallet.balance.cents,
      },
    });
  }
}