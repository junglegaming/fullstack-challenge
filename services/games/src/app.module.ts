import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RabbitMQModule } from "@golevelup/nestjs-rabbitmq";
import { ProvablyFair } from "./domain/provably-fair";
import { GameLoop } from "./application/game-loop";
import { RoundOrmEntity, BetOrmEntity } from "./infrastructure/persistence/game-entities";
import { CreateGameTables1748820000000 } from "./infrastructure/persistence/migrations/1748820000000-CreateGameTables";
import { TypeOrmGameRepository } from "./infrastructure/persistence/typeorm-game.repository";
import { GameEventsPublisher } from "./infrastructure/messaging/game-events.publisher";
import { WalletEventsConsumer } from "./infrastructure/messaging/wallet-events.consumer";
import { GameGateway } from "./presentation/gateways/game.gateway";
import { GamesController } from "./presentation/controllers/games.controller";
import { RoundsController } from "./presentation/controllers/rounds.controller";
import { BetsController } from "./presentation/controllers/bets.controller";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      synchronize: false,
      migrations: [CreateGameTables1748820000000],
      migrationsRun: true,
      entities: [RoundOrmEntity, BetOrmEntity],
    }),
    TypeOrmModule.forFeature([RoundOrmEntity, BetOrmEntity]),
    RabbitMQModule.forRoot({
      exchanges: [
        { name: "game", type: "topic" },
        { name: "wallet", type: "topic" },
      ],
      uri: process.env.RABBITMQ_URL ?? "amqp://admin:admin@localhost:5672",
      connectionInitOptions: { wait: false },
    }),
  ],
  controllers: [GamesController, RoundsController, BetsController],
  providers: [
    {
      provide: ProvablyFair,
      useFactory: () =>
        new ProvablyFair(process.env.HOUSE_KEY ?? "default-house-key"),
    },
    TypeOrmGameRepository,
    GameEventsPublisher,
    GameGateway,
    GameLoop,
    WalletEventsConsumer,
  ],
})
export class AppModule {}
