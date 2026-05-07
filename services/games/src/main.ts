import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { MikroORM } from "@mikro-orm/core";
import { mikroOrmConfig } from "./infrastructure/persistence/mikro-orm.config";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const orm = await MikroORM.init(mikroOrmConfig);

  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();
  console.log("Database schema updated successfully");

  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT;
  await app.listen(port, "0.0.0.0");
  console.log(`Games service running on port ${port}`);
}
bootstrap();
