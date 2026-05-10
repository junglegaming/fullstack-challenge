import { IWalletRepository } from '@/domain/repositories/wallet-repository.interface';
import { Money } from '@/domain/value-objects/Money';
import { WithdrawMoneyDTO } from '@/application/dtos/wallet.dto';

export class WithdrawMoneyUseCase {
  constructor(private walletRepository: IWalletRepository) {}

  async execute(dto: WithdrawMoneyDTO): Promise<void> {
    const wallet = await this.walletRepository.findByUserId(dto.userId);

    if (!wallet) {
      throw new Error('Carteira não encontrada para este usuário');
    }

    const amount = Money.fromCents(dto.amountInCents);

    if (!wallet.balance.isGreaterThanOrEqual(amount)) {
      throw new Error('Saldo insuficiente');
    }

    wallet.withdraw(amount);

    await this.walletRepository.save(wallet);
  }
}