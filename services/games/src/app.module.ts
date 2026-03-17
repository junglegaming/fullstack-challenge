import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";

@Module({
  controllers: [GamesController],
})
export class AppModule {}
