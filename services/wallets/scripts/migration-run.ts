import { AppDataSource } from "../src/infrastructure/persistence/data-source";

await AppDataSource.initialize();
await AppDataSource.runMigrations();
await AppDataSource.destroy();
console.log("Migrations applied.");
