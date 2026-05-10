import { Module } from "@nestjs/common";
import { GameController } from "@/presentation/controllers/game.controller";
import { GameGateway } from "@/presentation/gateways/game.gateway";
import { PostgresRoundRepository } from "@/infrastructure/database/repositories/postgres-round-repository";
import { PostgresBetRepository } from "@/infrastructure/database/repositories/postgres-bet-repository";
import { CreateBetUseCase } from "@/application/use-cases/create-bet.use-case";
import { CashoutBetUseCase } from "@/application/use-cases/cashout-bet.use-case";
import { StartRoundUseCase } from "@/application/use-cases/start-round.use-case";
import { CrashRoundUseCase } from "@/application/use-cases/crash-round.use-case";
import { CreateRoundUseCase } from "@/application/use-cases/create-round.use-case";
import { WalletClient } from "@/infrastructure/messaging/wallet-client";
import { PrismaService } from "./infrastructure/database/prisma.service";
import { IRoundRepository } from "./domain/repositories/IRoundRepository";
import { IBetRepository } from "./domain/repositories/IBetRepository";
import { GetRoundStatisticsUseCase } from "./application/use-cases/get-round-statistics.use-case";

@Module({
  controllers: [GameController],
  providers: [
    {
      provide: PrismaService,
      useValue: new PrismaService(),
    },
    {
      provide: IRoundRepository,
      useClass: PostgresRoundRepository,
    },
    {
      provide: IBetRepository,
      useClass: PostgresBetRepository,
    },
    WalletClient,
    GetRoundStatisticsUseCase,
    {
      provide: CreateBetUseCase,
      inject: [IBetRepository, IRoundRepository, WalletClient],
      useFactory: (
        betRepo: PostgresBetRepository,
        roundRepo: PostgresRoundRepository,
        walletClient: WalletClient,
      ) => new CreateBetUseCase(betRepo, roundRepo, walletClient),
    },
    {
      provide: CashoutBetUseCase,
      inject: [IBetRepository, IRoundRepository, WalletClient],
      useFactory: (
        betRepo: PostgresBetRepository,
        roundRepo: PostgresRoundRepository,
        walletClient: WalletClient,
      ) => new CashoutBetUseCase(betRepo, roundRepo, walletClient),
    },
    {
      provide: StartRoundUseCase,
      inject: [IRoundRepository],
      useFactory: (roundRepo: PostgresRoundRepository) =>
        new StartRoundUseCase(roundRepo),
    },
    {
      provide: CrashRoundUseCase,
      inject: [IRoundRepository, IBetRepository],
      useFactory: (
        roundRepo: PostgresRoundRepository,
        betRepo: PostgresBetRepository,
      ) => new CrashRoundUseCase(roundRepo, betRepo),
    },
    {
      provide: CreateRoundUseCase,
      inject: [IRoundRepository],
      useFactory: (roundRepo: PostgresRoundRepository) =>
        new CreateRoundUseCase(roundRepo),
    },
    GameGateway,
  ],
})
export class AppModule {}
