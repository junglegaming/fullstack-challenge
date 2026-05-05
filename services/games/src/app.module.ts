import { Module, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { GameGateway } from "./presentation/websocket/game.gateway";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.usecase";
import { CashoutUseCase } from "./application/use-cases/cashout.usecase";
import { StartRoundUseCase } from "./application/use-cases/start-round.usecase";
import { CrashRoundUseCase } from "./application/use-cases/crash-round.usecase";
import { FinishRoundUseCase } from "./application/use-cases/finish-round.usecase";
import { RoundRepositoryImpl } from "./infrastructure/repositories/round.repository.impl";
import { OutboxWorker } from "./infrastructure/workers/outbox.worker";
import { RabbitMQService } from "./infrastructure/messaging/rabbitmq.service";
import { IEventBus } from "./application/ports/event-bus.port";

@Module({
  controllers: [GamesController],
  providers: [
    GameGateway,
    PlaceBetUseCase,
    CashoutUseCase,
    StartRoundUseCase,
    CrashRoundUseCase,
    FinishRoundUseCase,
    {
      provide: 'RoundRepository',
      useClass: RoundRepositoryImpl,
    },
    {
      provide: IEventBus,
      useClass: RabbitMQService,
    },
    OutboxWorker,
  ],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly outboxWorker: OutboxWorker) {}

  onModuleInit() {
    this.outboxWorker.start();
  }

  onModuleDestroy() {
    this.outboxWorker.stop();
  }
}
