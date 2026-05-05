import { PlayerId } from '../../domain/value-objects/player-id.vo';
import { IWalletRepository } from '../ports/wallet-repository.port';
import { GetWalletDto } from '../dtos/get-wallet.dto';

export class GetWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  async execute(dto: GetWalletDto): Promise<{
    walletId: string;
    playerId: string;
    balanceCents: bigint;
    transactionCount: number;
  }> {
    const playerId = new PlayerId(dto.playerId);

    const wallet = await this.walletRepository.findByPlayerId(playerId);
    if (!wallet) {
      throw new Error(`Wallet not found for player ${dto.playerId}`);
    }

    return {
      walletId: wallet.walletId.raw,
      playerId: wallet.walletPlayerId.raw,
      balanceCents: wallet.walletBalance.amount,
      transactionCount: wallet.walletTransactions.length,
    };
  }
}
