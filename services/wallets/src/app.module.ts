import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreateWalletUseCase } from "./application/create-wallet.use-case";
import { GetMyWalletUseCase } from "./application/get-my-wallet.use-case";
import { WALLET_REPOSITORY } from "./application/wallet.repository";
import { WalletOrmEntity, WalletReservationOrmEntity } from "./infrastructure/persistence/wallet-entities";
import { CreateWalletTables1748476800000 } from "./infrastructure/persistence/migrations/1748476800000-CreateWalletTables";
import { TypeOrmWalletRepository } from "./infrastructure/persistence/typeorm-wallet.repository";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      synchronize: false,
      migrations: [CreateWalletTables1748476800000],
      migrationsRun: true,
      entities: [WalletOrmEntity, WalletReservationOrmEntity],
    }),
    TypeOrmModule.forFeature([WalletOrmEntity, WalletReservationOrmEntity]),
  ],
  controllers: [WalletsController],
  providers: [
    { provide: WALLET_REPOSITORY, useClass: TypeOrmWalletRepository },
    CreateWalletUseCase,
    GetMyWalletUseCase,
  ],
})
export class AppModule {}
