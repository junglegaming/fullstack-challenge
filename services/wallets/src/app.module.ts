import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RabbitMQModule } from "@golevelup/nestjs-rabbitmq";
import { CreateWalletUseCase } from "./application/create-wallet.use-case";
import { GetMyWalletUseCase } from "./application/get-my-wallet.use-case";
import { ReserveWalletUseCase } from "./application/reserve-wallet.use-case";
import { SettleWalletUseCase } from "./application/settle-wallet.use-case";
import { WALLET_REPOSITORY } from "./application/wallet.repository";
import { WalletOrmEntity, WalletReservationOrmEntity } from "./infrastructure/persistence/wallet-entities";
import { CreateWalletTables1748476800000 } from "./infrastructure/persistence/migrations/1748476800000-CreateWalletTables";
import { SeedTestPlayerWallet1748476900000 } from "./infrastructure/persistence/migrations/1748476900000-SeedTestPlayerWallet";
import { TypeOrmWalletRepository } from "./infrastructure/persistence/typeorm-wallet.repository";
import { WalletPublisher } from "./infrastructure/messaging/wallet.publisher";
import { WalletEventsConsumer } from "./infrastructure/messaging/wallet-events.consumer";
import { WalletsController } from "./presentation/controllers/wallets.controller";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      synchronize: false,
      migrations: [CreateWalletTables1748476800000, SeedTestPlayerWallet1748476900000],
      migrationsRun: true,
      entities: [WalletOrmEntity, WalletReservationOrmEntity],
    }),
    TypeOrmModule.forFeature([WalletOrmEntity, WalletReservationOrmEntity]),
    RabbitMQModule.forRoot({
      exchanges: [
        { name: "wallet", type: "topic" },
        { name: "game", type: "topic" },
      ],
      uri: process.env.RABBITMQ_URL ?? "amqp://admin:admin@localhost:5672",
      connectionInitOptions: { wait: false },
    }),
  ],
  controllers: [WalletsController],
  providers: [
    { provide: WALLET_REPOSITORY, useClass: TypeOrmWalletRepository },
    CreateWalletUseCase,
    GetMyWalletUseCase,
    ReserveWalletUseCase,
    SettleWalletUseCase,
    WalletPublisher,
    WalletEventsConsumer,
  ],
})
export class AppModule {}
