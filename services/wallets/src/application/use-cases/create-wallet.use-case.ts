import { IWalletRepository } from "@/domain/repositories/wallet-repository.interface";
import { CreateWalletDTO } from "@/application/dtos/wallet.dto";
import { Wallet } from "@/domain/entities/wallet";
import { Money } from "@/domain/value-objects/Money";

export class CreateWalletUseCase {
  constructor(private walletRepository: IWalletRepository) {}

  async execute(dto: CreateWalletDTO): Promise<Wallet> {
    const existingWallet = await this.walletRepository.findByUserId(dto.userId);

    if (existingWallet) {
      throw new Error("Já existe uma carteira para este usuário");
    }

    const wallet = new Wallet({
      userId: dto.userId,
      balance: Money.fromCents(0n),
      updatedAt: new Date(),
    });

    await this.walletRepository.create(wallet);
    return wallet;
  }
}
