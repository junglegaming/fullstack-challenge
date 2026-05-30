import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { WalletOrmEntity } from "./wallet.orm-entity";

@Entity("wallet_reservations")
@Index(["wallet", "reservationId"], { unique: true })
export class WalletReservationOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  reservationId!: string;

  @Column({ type: "bigint" })
  amount!: string;

  @ManyToOne(() => WalletOrmEntity, (wallet) => wallet.reservations, {
    nullable: false,
    onDelete: "CASCADE",
  })
  wallet!: WalletOrmEntity;
}
