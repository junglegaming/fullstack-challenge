import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from "typeorm";
import type { TransactionType } from "../../domain/entities/wallet-transaction.entity";

@Entity({ name: "wallet_transactions" })
export class WalletTransactionOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "wallet_id", type: "uuid" })
  walletId!: string;

  @Column({ type: "varchar", length: 8 })
  type!: TransactionType;

  @Column({ name: "amount_cents", type: "bigint" })
  amountCents!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  reference!: string;

  @Column({ name: "balance_after_cents", type: "bigint" })
  balanceAfterCents!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
