import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from "typeorm";
import { BetStatus } from "../../domain/entities/bet-status";
import { RoundOrmEntity } from "./round.orm-entity";

@Entity({ name: "bets" })

@Unique("uq_bet_round_player", ["roundId", "playerId"])
export class BetOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "round_id", type: "uuid" })
  roundId!: string;

  @Index()
  @Column({ name: "player_id", type: "varchar", length: 255 })
  playerId!: string;

  @Column({ type: "varchar", length: 255 })
  username!: string;

  @Column({ name: "amount_cents", type: "bigint" })
  amountCents!: string;

  @Column({ type: "varchar", length: 16 })
  status!: BetStatus;

  @Column({
    name: "cash_out_multiplier_hundredths",
    type: "int",
    nullable: true,
  })
  cashOutMultiplierHundredths!: number | null;

  @Column({ name: "payout_cents", type: "bigint", nullable: true })
  payoutCents!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "settled_at", type: "timestamptz", nullable: true })
  settledAt!: Date | null;

  @ManyToOne(() => RoundOrmEntity, (round) => round.bets, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "round_id" })
  round!: RoundOrmEntity;
}
