import { Module } from "@nestjs/common";
import { ProvablyFair } from "./domain/provably-fair";
import { GameLoop } from "./application/game-loop";
import { GamesController } from "./presentation/controllers/games.controller";

@Module({
  controllers: [GamesController],
  providers: [
    {
      provide: ProvablyFair,
      useFactory: () =>
        new ProvablyFair(process.env.HOUSE_KEY ?? "default-house-key"),
    },
    GameLoop,
  ],
})
export class AppModule {}
