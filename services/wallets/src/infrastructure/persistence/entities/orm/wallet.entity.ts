import { Entity, PrimaryKey, Property, OneToMany, Collection, Index } from '@mikro-orm/core';
import { TransactionEntity } from './transaction.entity';

@Entity({ tableName: 'wallets' })
export class WalletEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ length: 255, unique: true })
  @Index()
  playerId!: string;

  @Property({ type: 'bigint' })
  balanceCents!: bigint;

  @OneToMany('TransactionEntity', 'wallet', { orphanRemoval: false })
  transactions = new Collection<TransactionEntity>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
