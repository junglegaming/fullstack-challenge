import { Module } from "@nestjs/common";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { PrismaClient } from "./generated";
import { CreateWalletUseCase } from "./application/usecases/create-wallet.usecase";
import { GetWalletUseCase } from "./application/usecases/get-wallet.usecase";
import { WalletRepositoryImpl } from "./infrastructure/wallet.repository.impl";

@Module({
  controllers: [WalletsController],
  providers: [
  PrismaClient,
  WalletRepositoryImpl,
  CreateWalletUseCase,
  GetWalletUseCase,
  {
    provide: 'WalletRepository',
    useClass: WalletRepositoryImpl,
  },
]
})
export class AppModule {}
