import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { RoundStatus } from "../../domain/entities/round-status";
import { BetOrmEntity } from "./bet.orm-entity";

@Entity({ name: "rounds" })
export class RoundOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "int" })
  nonce!: number;

  @Index()
  @Column({ type: "varchar", length: 16 })
  status!: RoundStatus;

  @Column({ name: "server_seed", type: "varchar", length: 128 })
  serverSeed!: string;

  @Column({ name: "server_seed_hash", type: "varchar", length: 128 })
  serverSeedHash!: string;

  @Column({ name: "crash_point_hundredths", type: "int" })
  crashPointHundredths!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "betting_ends_at", type: "timestamptz" })
  bettingEndsAt!: Date;

  @Column({ name: "started_at", type: "timestamptz", nullable: true })
  startedAt!: Date | null;

  @Column({ name: "crashed_at", type: "timestamptz", nullable: true })
  crashedAt!: Date | null;

  @OneToMany(() => BetOrmEntity, (bet) => bet.round, { cascade: true })
  bets!: BetOrmEntity[];
}
