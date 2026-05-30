import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { WalletReservationOrmEntity } from "./wallet-reservation.orm-entity";

@Entity("wallets")
export class WalletOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", unique: true })
  playerId!: string;

  @Column({ type: "bigint" })
  availableBalance!: string;

  @OneToMany(() => WalletReservationOrmEntity, (reservation) => reservation.wallet, {
    cascade: true,
  })
  reservations!: WalletReservationOrmEntity[];
}
