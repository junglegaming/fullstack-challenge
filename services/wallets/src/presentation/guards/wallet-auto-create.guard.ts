// services/wallets/src/infrastructure/guards/wallet-auto-create.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CreateWalletUseCase } from '@/application/use-cases/create-wallet.use-case';
import { GetWalletBalanceUseCase } from '@/application/use-cases/get-wallet-balance.use-case';

@Injectable()
export class WalletAutoCreateGuard implements CanActivate {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletBalanceUseCase: GetWalletBalanceUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) {
      return true;
    }

    try {
      await this.getWalletBalanceUseCase.execute(userId);
      return true;
    } catch (error: any) {
      if (error.message?.includes('not found') || error.status === 404 || error.message?.includes('Carteira')) {
        try {
          await this.createWalletUseCase.execute({ userId });
          return true;
        } catch (createError: any) {
          return true;
        }
      }

      return true;
    }
  }
}