import { IWalletRepository } from '@/domain/repositories/wallet-repository.interface';
import { WalletResponseDTO } from '@/application/dtos/wallet.dto';

export class GetWalletBalanceUseCase {
  constructor(private walletRepository: IWalletRepository) {}

  async execute(userId: string): Promise<WalletResponseDTO> {
    const wallet = await this.walletRepository.findByUserId(userId);

    if (!wallet) {
      throw new Error('Carteira não encontrada para este usuário');
    }

    return {
      userId: wallet.userId,
      balance: wallet.balance.toString(),
      updatedAt: wallet.toJSON().updatedAt,
    };
  }
}
