import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletsController } from "./presentation/controllers/wallets.controller";
import { WalletOrmEntity, WalletReservationOrmEntity } from "./infrastructure/persistence/wallet-entities";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      synchronize: false,
      entities: [WalletOrmEntity, WalletReservationOrmEntity],
    }),
  ],
  controllers: [WalletsController],
})
export class AppModule {}
