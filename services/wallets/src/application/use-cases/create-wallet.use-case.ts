import { WalletAlreadyExistsError } from "../../domain/errors/wallet-already-exists.error";
import { Wallet } from "../../domain/entities/wallet";
import { Money } from "../../domain/value-objects/money";
import { PlayerId } from "../../domain/value-objects/player-id";
import { CreateWalletResult } from "../dtos/create-wallet-result.dto";
import { WalletRepository } from "../ports/wallet.repository";

export class CreateWalletUseCase {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly initialBalance: Money,
  ) {}

  async execute(playerId: PlayerId): Promise<CreateWalletResult> {
    const existingWallet = await this.walletRepository.findByPlayerId(playerId);

    if (existingWallet) {
      throw new WalletAlreadyExistsError(playerId.toString());
    }

    const wallet = Wallet.create({
      playerId,
      initialBalance: this.initialBalance,
    });

    await this.walletRepository.save(wallet);

    return { wallet };
  }
}
