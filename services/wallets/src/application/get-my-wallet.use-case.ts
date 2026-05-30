import { Inject, Injectable } from "@nestjs/common";
import { Wallet } from "@/domain/wallet";
import { WalletNotFoundError } from "@/domain/errors";
import { WALLET_REPOSITORY } from "./wallet.repository";
import type { WalletRepository } from "./wallet.repository";

@Injectable()
export class GetMyWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(playerId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      throw new WalletNotFoundError(playerId);
    }
    return wallet;
  }
}
