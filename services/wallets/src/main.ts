import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppDataSource } from "./infrastructure/persistence/data-source";

async function bootstrap(): Promise<void> {
  const ds = await AppDataSource.initialize();
  await ds.runMigrations();
  await ds.destroy();

  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT;
  await app.listen(port, "0.0.0.0");
  console.log(`Wallets service running on port ${port}`);
}

bootstrap();
