import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GameEngine } from "./application/game.engine";
import { GameGateway } from "./presentation/getways/game.gateway";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  

  const port = process.env.PORT || 4001;
  await app.listen(port, "0.0.0.0");

  const gameGateway = app.get(GameGateway);
  
  const engine = new GameEngine(gameGateway);

  engine.start()
  
  console.log(`Games service running on port ${port}`);
}

bootstrap();
