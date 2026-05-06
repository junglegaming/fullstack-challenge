import type { WalletRepository } from "../../domain/wallet.repository"
import { Inject, Injectable } from "@nestjs/common"

@Injectable()
export class GetWalletUseCase {
  constructor( @Inject('WalletRepository') private walletRepo: WalletRepository) {}

  async execute(playerId: string) {
    const wallet = await this.walletRepo.findByPlayerId(playerId)

    if (!wallet) {
      throw new Error('WALLET_NOT_FOUND')
    }

    return wallet
  }
}