import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { GameGateway } from "./presentation/getways/game.gateway";
import { GameEngine } from "./application/game.engine";
import { RoundService } from "./application/service/round.service";
import { PlaceBetUseCase } from "./application/usecases/place-bet.usecase";
import { CashoutUseCase } from "./application/usecases/cashout.usecase";
import { PrismaClient } from "./generated";
import { RabbitMQClient } from "./application/rabbitmq.client";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { JwtStrategy } from "@crash/auth"
import { GameRepository } from "./infrastructure/repositories/game.repository";



@Module({
  imports: [
    // 🆕 Registrando o WALLET_SERVICE para o RabbitMQClient poder usar
    ClientsModule.register([
      {
        name: 'WALLET_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
          queue: 'wallet_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [GamesController],
  providers: [
  JwtStrategy,
  PrismaClient,
  GameGateway,
  GameEngine,
  GameRepository,
  RoundService,
  PlaceBetUseCase,
  CashoutUseCase,
  RabbitMQClient,
]
})
export class AppModule {}
