import { Module } from "@nestjs/common";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { CreateWalletUseCase } from "./application/usecases/create-wallet.usecase";
import { GetWalletUseCase } from "./application/usecases/get-wallet.usecase";
import { WalletRepositoryImpl } from "./infrastructure/wallet.repository.impl";
import { WalletConsumer } from "./presentation/wallet.consumer";
import { PrismaClient } from "./generated";
import { JwtStrategy } from "../../../packages/auth/src/jwt.strategy";

@Module({
  controllers: [
    WalletsController,
    WalletConsumer
  ],
  providers: [
  JwtStrategy,
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
