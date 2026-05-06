import { Module, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { PassportModule } from "@nestjs/passport";
import mikroOrmConfig from "./infrastructure/persistence/mikro-orm.config";
import { GamesController } from "./presentation/controllers/games.controller";
import { GameGateway } from "./presentation/websocket/game.gateway";
import { PlaceBetUseCase } from "./application/use-cases/place-bet.usecase";
import { CashoutUseCase } from "./application/use-cases/cashout.usecase";
import { StartRoundUseCase } from "./application/use-cases/start-round.usecase";
import { CrashRoundUseCase } from "./application/use-cases/crash-round.usecase";
import { FinishRoundUseCase } from "./application/use-cases/finish-round.usecase";
import { RoundRepositoryImpl } from "./infrastructure/repositories/round.repository.impl";
import { OutboxWorker } from "./infrastructure/workers/outbox.worker";
import { GameLoopService } from "./infrastructure/services/game-loop.service";
import { RabbitMQService } from "./infrastructure/messaging/rabbitmq.service";
import { IEventBus } from "./application/ports/event-bus.port";
import { IWebSocketEmitter } from "./application/ports/websocket-emitter.port";
import { JwtStrategy } from "./infrastructure/auth/jwt.strategy";
import { JwtAuthGuard } from "./presentation/guards/jwt-auth.guard";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    MikroOrmModule.forRoot(mikroOrmConfig),
    MikroOrmModule.forFeature({
      entities: [
        "./infrastructure/persistence/entities/orm/round.entity",
        "./infrastructure/persistence/entities/orm/bet.entity",
        "./infrastructure/persistence/entities/orm/outbox-event.entity",
      ],
    }),
  ],
  controllers: [GamesController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    GameGateway,
    PlaceBetUseCase,
    CashoutUseCase,
    StartRoundUseCase,
    CrashRoundUseCase,
    FinishRoundUseCase,
    RoundRepositoryImpl,
    {
      provide: "RoundRepository",
      useClass: RoundRepositoryImpl,
    },
    {
      provide: IEventBus,
      useClass: RabbitMQService,
    },
    {
      provide: IWebSocketEmitter,
      useExisting: GameGateway,
    },
    OutboxWorker,
    GameLoopService,
    RabbitMQService,
  ],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly outboxWorker: OutboxWorker,
    private readonly gameLoopService: GameLoopService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    await this.rabbitMQService.connect();
    this.outboxWorker.start();
    this.gameLoopService.startLoop();
  }

  async onModuleDestroy() {
    this.outboxWorker.stop();
    this.gameLoopService.stopLoop();
    await this.rabbitMQService.close();
  }
}
