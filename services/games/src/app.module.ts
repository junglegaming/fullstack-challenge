import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { GameGateway } from "./presentation/getways/game.gateway";
import { GameEngine } from "./application/game.engine";

@Module({
  controllers: [GamesController],
  providers: [
  GameGateway,
  GameEngine,
]
})
export class AppModule {}
