import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { GameGateway } from "./presentation/getways/game.gateway";

@Module({
  controllers: [GamesController],
  providers: [
  GameGateway,
]
})
export class AppModule {}
