import { Module } from "@nestjs/common";
import { GAME_ROUNDS_REPOSITORY } from "./application/ports/game-rounds.repository";
import type { GameRoundsRepository } from "./application/ports/game-rounds.repository";
import { CashOutBetUseCase } from "./application/use-cases/cash-out-bet.use-case";
import { GetCurrentRoundUseCase } from "./application/use-cases/get-current-round.use-case";
import { GetPlayerBetsUseCase } from "./application/use-cases/get-player-bets.use-case";
import { GetRoundHistoryUseCase } from "./application/use-cases/get-round-history.use-case";
import { GetRoundVerificationUseCase } from "./application/use-cases/get-round-verification.use-case";
import { ProvablyFairService } from "./domain/services/provably-fair.service";
import { InMemoryGameRoundsRepository } from "./infrastructure/persistence/in-memory-game-rounds.repository";
import { GamesController } from "./presentation/controllers/games.controller";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.use-case";

@Module({
  controllers: [GamesController],
  providers: [
    ProvablyFairService,
    InMemoryGameRoundsRepository,
    {
      provide: GAME_ROUNDS_REPOSITORY,
      useExisting: InMemoryGameRoundsRepository,
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
      inject: [GAME_ROUNDS_REPOSITORY],
      useFactory: (roundsRepository: GameRoundsRepository) =>
        new PlaceBetUseCase(roundsRepository),
    },
    {
      provide: CashOutBetUseCase,
      inject: [GAME_ROUNDS_REPOSITORY],
      useFactory: (roundsRepository: GameRoundsRepository) =>
        new CashOutBetUseCase(roundsRepository),
    },
  ],
})
export class AppModule {}
