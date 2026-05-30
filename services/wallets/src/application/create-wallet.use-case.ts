import { Inject, Injectable } from "@nestjs/common";
import { Wallet } from "@/domain/wallet";
import { WalletAlreadyExistsError } from "@/domain/errors";
import { WALLET_REPOSITORY } from "./wallet.repository";
import type { WalletRepository } from "./wallet.repository";

@Injectable()
export class CreateWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: WalletRepository,
  ) {}

  async execute(playerId: string): Promise<Wallet> {
    const existing = await this.walletRepository.findByPlayerId(playerId);
    if (existing) {
      throw new WalletAlreadyExistsError(playerId);
    }
    const wallet = Wallet.create(playerId);
    await this.walletRepository.save(wallet);
    return wallet;
  }
}
