import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WalletOrmEntity } from "./wallet.orm-entity";
import { WalletTransactionOrmEntity } from "./wallet-transaction.orm-entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        url: config.getOrThrow<string>("DATABASE_URL"),
        entities: [WalletOrmEntity, WalletTransactionOrmEntity],
        synchronize: true,
        retryAttempts: 15,
        retryDelay: 3000,
      }),
    }),
    TypeOrmModule.forFeature([WalletOrmEntity, WalletTransactionOrmEntity]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
