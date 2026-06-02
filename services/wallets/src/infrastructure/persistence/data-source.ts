import { DataSource } from "typeorm";
import { WalletOrmEntity } from "./wallet.orm-entity";
import { WalletReservationOrmEntity } from "./wallet-reservation.orm-entity";
import { CreateWalletTables1748476800000 } from "./migrations/1748476800000-CreateWalletTables";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false,
  entities: [WalletOrmEntity, WalletReservationOrmEntity],
  migrations: [CreateWalletTables1748476800000],
});
