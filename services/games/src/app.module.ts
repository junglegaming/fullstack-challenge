import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { GameConfig } from "./application/game-config";
import { GameEngine } from "./application/game-engine.service";
import { GAME_EVENTS_PUBLISHER } from "./application/ports/game-events.publisher";
import { ID_GENERATOR } from "./application/ports/id-generator";
import { ROUND_REPOSITORY } from "./application/ports/round.repository";
import { SEED_CHAIN_PROVIDER } from "./application/ports/seed-chain.provider";
import { WALLET_GATEWAY } from "./application/ports/wallet.gateway";
import { CashOutUseCase } from "./application/use-cases/cash-out.use-case";
import { GetCurrentRoundUseCase } from "./application/use-cases/get-current-round.use-case";
import { GetMyBetsUseCase } from "./application/use-cases/get-my-bets.use-case";
import { GetRoundHistoryUseCase } from "./application/use-cases/get-round-history.use-case";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.use-case";
import { VerifyRoundUseCase } from "./application/use-cases/verify-round.use-case";
import { KeycloakJwtGuard } from "./infrastructure/auth/keycloak-jwt.guard";
import { AmqpService } from "./infrastructure/messaging/amqp.service";
import { RabbitMqWalletGateway } from "./infrastructure/messaging/rabbitmq-wallet.gateway";
import { WalletReplyConsumer } from "./infrastructure/messaging/wallet-reply.consumer";
import { DatabaseModule } from "./infrastructure/persistence/database.module";
import { SeedChainTypeOrmProvider } from "./infrastructure/persistence/seed-chain.provider";
import { TypeOrmRoundRepository } from "./infrastructure/persistence/typeorm-round.repository";
import { UuidGenerator } from "./infrastructure/persistence/uuid.generator";
import { GameGateway } from "./infrastructure/websocket/game.gateway";
import { GamesController } from "./presentation/controllers/games.controller";
import { HealthController } from "./presentation/controllers/health.controller";
import { DomainExceptionFilter } from "./presentation/filters/domain-exception.filter";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
  controllers: [HealthController, GamesController],
  providers: [
    GameConfig,
    GameEngine,
    AmqpService,
    KeycloakJwtGuard,
    GameGateway,
    PlaceBetUseCase,
    CashOutUseCase,
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    GetMyBetsUseCase,
    VerifyRoundUseCase,
    WalletReplyConsumer,
    { provide: ROUND_REPOSITORY, useClass: TypeOrmRoundRepository },
    { provide: SEED_CHAIN_PROVIDER, useClass: SeedChainTypeOrmProvider },
    { provide: WALLET_GATEWAY, useClass: RabbitMqWalletGateway },
    { provide: GAME_EVENTS_PUBLISHER, useExisting: GameGateway },
    { provide: ID_GENERATOR, useClass: UuidGenerator },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
