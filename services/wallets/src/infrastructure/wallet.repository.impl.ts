import { PrismaClient } from "../generated"
import { Wallet } from "../domain/wallet.entity"
import { WalletRepository } from "../domain/wallet.repository"
import { Injectable } from "@nestjs/common"

@Injectable()
export class WalletRepositoryImpl implements WalletRepository {
  constructor(private prisma: PrismaClient) {}

  async findByPlayerId(playerId: string) {
    const data = await this.prisma.wallet.findUnique({
      where: { 
        playerId,
        
    },
    })

    if (!data){ return null } 

    return new Wallet(data.playerId, BigInt(data.balance))
  }

  async save(wallet: Wallet) {
    await this.prisma.wallet.upsert({
      where: { playerId: wallet.playerId },
      update: { balance: wallet.balance.toString() },
      create: {
        playerId: wallet.playerId,
        balance: wallet.balance.toString(),
      },
    })
  }
}