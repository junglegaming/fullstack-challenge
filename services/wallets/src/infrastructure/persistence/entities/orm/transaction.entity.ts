import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';
import { WalletEntity } from './wallet.entity';

@Entity({ tableName: 'transactions' })
export class TransactionEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => WalletEntity)
  wallet!: WalletEntity;

  @Property({ length: 20 })
  type!: string;

  @Property({ type: 'bigint' })
  amountCents!: bigint;

  @Property({ type: 'bigint' })
  balanceAfterCents!: bigint;

  @Property({ length: 255, unique: true })
  @Index()
  referenceId!: string;

  @Property({ length: 20 })
  status!: string;

  @Property()
  createdAt: Date = new Date();
}
