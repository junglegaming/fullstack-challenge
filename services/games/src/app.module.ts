import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import {
  GAME_ROUND_ENGINE_CONFIG,
  type GameRoundEngineConfig,
  resolveGameRoundEngineConfig,
} from "./application/config/game-round-engine.config";
import { GAME_REALTIME_PUBLISHER } from "./application/ports/game-realtime.publisher";
import { GAME_ROUNDS_REPOSITORY } from "./application/ports/game-rounds.repository";
import type { GameRoundsRepository } from "./application/ports/game-rounds.repository";
import { WALLET_COMMAND_PUBLISHER } from "./application/ports/wallet-command.publisher";
import { GameRoundEngineService } from "./application/services/game-round-engine.service";
import { CashOutBetUseCase } from "./application/use-cases/cash-out-bet.use-case";
import { GetCurrentRoundUseCase } from "./application/use-cases/get-current-round.use-case";
import { GetPlayerBetsUseCase } from "./application/use-cases/get-player-bets.use-case";
import { GetRoundHistoryUseCase } from "./application/use-cases/get-round-history.use-case";
import { GetRoundVerificationUseCase } from "./application/use-cases/get-round-verification.use-case";
import { HandleWalletDebitFailedUseCase } from "./application/use-cases/handle-wallet-debit-failed.use-case";
import { HandleWalletDebitSucceededUseCase } from "./application/use-cases/handle-wallet-debit-succeeded.use-case";
import { HandleWalletCreditFailedUseCase } from "./application/use-cases/handle-wallet-credit-failed.use-case";
import { HandleWalletCreditSucceededUseCase } from "./application/use-cases/handle-wallet-credit-succeeded.use-case";
import { ProvablyFairService } from "./domain/services/provably-fair.service";
import {
  getRabbitMqUrl,
  getWalletQueueName,
  WALLET_RMQ_CLIENT,
} from "./infrastructure/messaging/rabbitmq.constants";
import { RabbitMqWalletCommandPublisher } from "./infrastructure/messaging/rabbitmq-wallet-command.publisher";
import { PrismaGameRoundsRepository } from "./infrastructure/persistence/prisma/repositories/prisma-game-rounds.repository";
import { PrismaService } from "./infrastructure/persistence/prisma/prisma.service";
import { GamesController } from "./presentation/controllers/games.controller";
import { GameRealtimeGateway } from "./presentation/gateways/game-realtime.gateway";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.use-case";
import { WalletDebitResultConsumer } from "./presentation/messaging/wallet-debit-result.consumer";
import { WalletCreditResultConsumer } from "./presentation/messaging/wallet-credit-result.consumer";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: WALLET_RMQ_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [getRabbitMqUrl()],
          queue: getWalletQueueName(),
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [GamesController, WalletDebitResultConsumer, WalletCreditResultConsumer],
  providers: [
    ProvablyFairService,
    PrismaService,
    {
      provide: GAME_ROUND_ENGINE_CONFIG,
      useFactory: resolveGameRoundEngineConfig,
    },
    PrismaGameRoundsRepository,
    GameRoundEngineService,
    RabbitMqWalletCommandPublisher,
    GameRealtimeGateway,
    {
      provide: GAME_ROUNDS_REPOSITORY,
      useExisting: PrismaGameRoundsRepository,
    },
    {
      provide: GAME_REALTIME_PUBLISHER,
      useExisting: GameRealtimeGateway,
    },
    {
      provide: WALLET_COMMAND_PUBLISHER,
      useExisting: RabbitMqWalletCommandPublisher,
    },
    {
      provide: GetCurrentRoundUseCase,
      inject: [GAME_ROUNDS_REPOSITORY],
      useFactory: (roundsRepository: GameRoundsRepository) =>
        new GetCurrentRoundUseCase(roundsRepository),
    },
    {
      provide: GetRoundHistoryUseCase,
      inject: [GAME_ROUNDS_REPOSITORY],
      useFactory: (roundsRepository: GameRoundsRepository) =>
        new GetRoundHistoryUseCase(roundsRepository),
    },
    {
      provide: GetRoundVerificationUseCase,
      inject: [ProvablyFairService, GAME_ROUNDS_REPOSITORY],
      useFactory: (
        provablyFairService: ProvablyFairService,
        roundsRepository: GameRoundsRepository,
      ) => new GetRoundVerificationUseCase(provablyFairService, roundsRepository),
    },
    {
      provide: GetPlayerBetsUseCase,
      inject: [GAME_ROUNDS_REPOSITORY],
      useFactory: (roundsRepository: GameRoundsRepository) =>
        new GetPlayerBetsUseCase(roundsRepository),
    },
    {
      provide: PlaceBetUseCase,
      inject: [GAME_ROUNDS_REPOSITORY, WALLET_COMMAND_PUBLISHER],
      useFactory: (
        roundsRepository: GameRoundsRepository,
        walletCommandPublisher: RabbitMqWalletCommandPublisher,
      ) => new PlaceBetUseCase(roundsRepository, walletCommandPublisher),
    },
    {
      provide: CashOutBetUseCase,
      inject: [
        GAME_ROUNDS_REPOSITORY,
        WALLET_COMMAND_PUBLISHER,
        GAME_ROUND_ENGINE_CONFIG,
        GAME_REALTIME_PUBLISHER,
      ],
      useFactory: (
        roundsRepository: GameRoundsRepository,
        walletCommandPublisher: RabbitMqWalletCommandPublisher,
        engineConfig: GameRoundEngineConfig,
        realtimePublisher: GameRealtimeGateway,
      ) => new CashOutBetUseCase(
        roundsRepository,
        walletCommandPublisher,
        engineConfig,
        realtimePublisher,
      ),
    },
    {
      provide: HandleWalletDebitSucceededUseCase,
      inject: [GAME_ROUNDS_REPOSITORY, GAME_REALTIME_PUBLISHER],
      useFactory: (
        roundsRepository: GameRoundsRepository,
        realtimePublisher: GameRealtimeGateway,
      ) => new HandleWalletDebitSucceededUseCase(
        roundsRepository,
        realtimePublisher,
      ),
    },
    {
      provide: HandleWalletDebitFailedUseCase,
      inject: [GAME_ROUNDS_REPOSITORY],
      useFactory: (roundsRepository: GameRoundsRepository) =>
        new HandleWalletDebitFailedUseCase(roundsRepository),
    },
    {
      provide: HandleWalletCreditSucceededUseCase,
      inject: [GAME_ROUNDS_REPOSITORY],
      useFactory: (roundsRepository: GameRoundsRepository) =>
        new HandleWalletCreditSucceededUseCase(roundsRepository),
    },
    {
      provide: HandleWalletCreditFailedUseCase,
      inject: [GAME_ROUNDS_REPOSITORY],
      useFactory: (roundsRepository: GameRoundsRepository) =>
        new HandleWalletCreditFailedUseCase(roundsRepository),
    },
  ],
})
export class AppModule {}
