import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { WalletReservationOrmEntity } from "./wallet-reservation.orm-entity";

@Entity("wallets")
export class WalletOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  playerId!: string;

  @Column({ type: "bigint" })
  availableBalance!: string;

  // require() instead of static import: Bun emits __metadata("design:type", X) at class
  // init time; a static import here creates a circular TDZ. require() is lazy (called after
  // all modules load) and shares Bun's module cache with the ESM import of the same file.
  @OneToMany(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("./wallet-reservation.orm-entity") as { WalletReservationOrmEntity: typeof WalletReservationOrmEntity }).WalletReservationOrmEntity,
    (reservation) => reservation.wallet,
    { cascade: true },
  )
  reservations!: WalletReservationOrmEntity[];
}
