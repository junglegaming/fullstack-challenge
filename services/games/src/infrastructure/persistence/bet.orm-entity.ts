import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { BetStatus } from "../../domain/bet";
import { RoundOrmEntity } from "./round.orm-entity";

@Entity("bets")
@Index(["round", "playerId"], { unique: true })
export class BetOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar" })
  playerId!: string;

  @Column({ type: "bigint" })
  amountCents!: string;

  @Column({ type: "enum", enum: BetStatus })
  status!: BetStatus;

  @Column({ type: "bigint", nullable: true })
  payoutCents!: string | null;

  @ManyToOne(() => RoundOrmEntity, (round) => round.bets, {
    nullable: false,
    onDelete: "CASCADE",
  })
  round!: RoundOrmEntity;
}
