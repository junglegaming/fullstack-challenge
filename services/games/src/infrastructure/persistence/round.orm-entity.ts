import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoundState } from "../../domain/round";
import type { BetOrmEntity } from "./bet.orm-entity";

@Entity("rounds")
export class RoundOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "enum", enum: RoundState })
  state!: RoundState;

  @Column({ type: "varchar" })
  seed!: string;

  @Column({ type: "varchar" })
  hash!: string;

  @Column({ type: "float" })
  crashPoint!: number;

  @Column({ type: "timestamp", nullable: true })
  startedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  // require() avoids circular TDZ: Bun emits __metadata at class init time;
  // a static import of a mutually-referencing entity creates a race.
  @OneToMany(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("./bet.orm-entity") as { BetOrmEntity: typeof BetOrmEntity }).BetOrmEntity,
    (bet: BetOrmEntity) => bet.round,
  )
  bets!: BetOrmEntity[];
}
