import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BetOrmEntity } from "./bet.orm-entity";
import { RoundOrmEntity } from "./round.orm-entity";
import { SeedChainEntryOrmEntity } from "./seed-chain-entry.orm-entity";

const ENTITIES = [RoundOrmEntity, BetOrmEntity, SeedChainEntryOrmEntity];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        url: config.getOrThrow<string>("DATABASE_URL"),
        entities: ENTITIES,
        synchronize: true,

        retryAttempts: 15,
        retryDelay: 3000,
      }),
    }),
    TypeOrmModule.forFeature(ENTITIES),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
