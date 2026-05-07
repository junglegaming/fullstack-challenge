import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { GameEngine } from "./application/game.engine";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const engine = new GameEngine()

  engine.start()

  const port = process.env.PORT;
  await app.listen(port, "0.0.0.0");
  
  console.log(`Games service running on port ${port}`);
}

bootstrap();
