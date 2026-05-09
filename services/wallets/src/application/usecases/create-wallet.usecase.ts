import { Wallet } from "@/domain/wallet.entity"
import type { WalletRepository } from "../../domain/wallet.repository"
import { Inject, Injectable } from "@nestjs/common"

@Injectable()
export class CreateWalletUseCase {
    
  constructor( @Inject('WalletRepository') private walletRepo: WalletRepository) {}

  async execute(playerId: string) {
    const existing = await this.walletRepo.findByPlayerId(playerId)

    if (existing) {
      throw new Error('WALLET_ALREADY_EXISTS')
    }

    const wallet = new Wallet(playerId, 10000n)

    await this.walletRepo.save(wallet)

    return wallet
  }
}