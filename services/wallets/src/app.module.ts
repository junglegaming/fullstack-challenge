import { Module } from "@nestjs/common";
import { WalletController } from "@/presentation/controllers/wallet.controller";
import { WalletEventsController } from "@/presentation/messaging/wallet-events.controller";
import { WalletAutoCreateGuard } from "@/presentation/guards/wallet-auto-create.guard";
import { PostgresWalletRepository } from "@/infrastructure/database/repositories/postgres-wallet-repository";
import { CreateWalletUseCase } from "@/application/use-cases/create-wallet.use-case";
import { DepositMoneyUseCase } from "@/application/use-cases/deposit-money.use-case";
import { WithdrawMoneyUseCase } from "@/application/use-cases/withdraw-money.use-case";
import { GetWalletBalanceUseCase } from "@/application/use-cases/get-wallet-balance.use-case";
import { PrismaService } from "@/infrastructure/database/prisma.service";

@Module({
  controllers: [WalletController, WalletEventsController],
  providers: [
    PrismaService,
    {
      provide: "IWalletRepository",
      useClass: PostgresWalletRepository,
    },
    {
      provide: CreateWalletUseCase,
      inject: ["IWalletRepository"],
      useFactory: (repo: PostgresWalletRepository) =>
        new CreateWalletUseCase(repo),
    },
    {
      provide: DepositMoneyUseCase,
      inject: ["IWalletRepository"],
      useFactory: (repo: PostgresWalletRepository) =>
        new DepositMoneyUseCase(repo),
    },
    {
      provide: WithdrawMoneyUseCase,
      inject: ["IWalletRepository"],
      useFactory: (repo: PostgresWalletRepository) =>
        new WithdrawMoneyUseCase(repo),
    },
    {
      provide: GetWalletBalanceUseCase,
      inject: ["IWalletRepository"],
      useFactory: (repo: PostgresWalletRepository) =>
        new GetWalletBalanceUseCase(repo),
    },
    WalletAutoCreateGuard,
  ],
})
export class AppModule {}