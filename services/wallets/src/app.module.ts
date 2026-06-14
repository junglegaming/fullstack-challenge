import { Module } from "@nestjs/common";
import { Money } from "./domain/value-objects/money";
import { CreateWalletUseCase } from "./application/use-cases/create-wallet.use-case";
import { GetWalletByPlayerUseCase } from "./application/use-cases/get-wallet-by-player.use-case";
import { InternalCreditWalletUseCase } from "./application/use-cases/internal-credit-wallet.use-case";
import { InternalDebitWalletUseCase } from "./application/use-cases/internal-debit-wallet.use-case";
import { WALLET_REPOSITORY } from "./application/ports/wallet.repository";
import { PrismaService } from "./infrastructure/persistence/prisma/prisma.service";
import { PrismaWalletRepository } from "./infrastructure/persistence/prisma/repositories/prisma-wallet.repository";
import { WalletsController } from "./presentation/controllers/wallets.controller";

function resolveInitialBalance(): Money {
  const rawValue = process.env.WALLET_INITIAL_BALANCE_CENTS ?? "100000";
  return Money.fromCentsString(rawValue);
}

@Module({
  controllers: [WalletsController],
  providers: [
    PrismaService,
    {
      provide: WALLET_REPOSITORY,
      useClass: PrismaWalletRepository,
    },
    {
      provide: CreateWalletUseCase,
      inject: [WALLET_REPOSITORY],
      useFactory: (walletRepository: PrismaWalletRepository) =>
        new CreateWalletUseCase(walletRepository, resolveInitialBalance()),
    },
    {
      provide: GetWalletByPlayerUseCase,
      inject: [WALLET_REPOSITORY],
      useFactory: (walletRepository: PrismaWalletRepository) =>
        new GetWalletByPlayerUseCase(walletRepository),
    },
    {
      provide: InternalDebitWalletUseCase,
      inject: [WALLET_REPOSITORY],
      useFactory: (walletRepository: PrismaWalletRepository) =>
        new InternalDebitWalletUseCase(walletRepository),
    },
    {
      provide: InternalCreditWalletUseCase,
      inject: [WALLET_REPOSITORY],
      useFactory: (walletRepository: PrismaWalletRepository) =>
        new InternalCreditWalletUseCase(walletRepository),
    },
  ],
})
export class AppModule {}
