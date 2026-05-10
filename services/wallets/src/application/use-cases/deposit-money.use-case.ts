import { IWalletRepository } from '@/domain/repositories/wallet-repository.interface';
import { Money } from '@/domain/value-objects/Money';
import { DepositMoneyDTO } from '@/application/dtos/wallet.dto';

export class DepositMoneyUseCase {
  constructor(private walletRepository: IWalletRepository) {}

  async execute(dto: DepositMoneyDTO): Promise<void> {
    const wallet = await this.walletRepository.findByUserId(dto.userId);

    if (!wallet) {
      throw new Error('Carteira não encontrada para este usuário');
    }

    const amount = Money.fromCents(dto.amountInCents);
    wallet.deposit(amount);

    await this.walletRepository.save(wallet);
  }
}