import { WalletNotFoundError } from "../../domain/errors/wallet-not-found.error";
import { PlayerId } from "../../domain/value-objects/player-id";
import { GetWalletResult } from "../dtos/create-wallet-result.dto";
import { WalletRepository } from "../ports/wallet.repository";

export class GetWalletByPlayerUseCase {
  constructor(private readonly walletRepository: WalletRepository) {}

  async execute(playerId: PlayerId): Promise<GetWalletResult> {
    const wallet = await this.walletRepository.findByPlayerId(playerId);

    if (!wallet) {
      throw new WalletNotFoundError(playerId.toString());
    }

    return { wallet };
  }
}
