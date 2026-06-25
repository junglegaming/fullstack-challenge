import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "seed_chain_entries" })
export class SeedChainEntryOrmEntity {

  @PrimaryColumn({ type: "int" })
  nonce!: number;

  @Column({ name: "server_seed", type: "varchar", length: 128 })
  serverSeed!: string;

  @Column({ name: "server_seed_hash", type: "varchar", length: 128 })
  serverSeedHash!: string;
}
