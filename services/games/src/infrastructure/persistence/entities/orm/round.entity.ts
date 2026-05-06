import { Entity, PrimaryKey, Property, OneToMany, Collection, Index } from '@mikro-orm/core';
import { BetEntity } from './bet.entity';

@Entity({ tableName: 'rounds' })
export class RoundEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ length: 20 })
  @Index()
  status!: string;

  @Property({ type: 'numeric', precision: 10, scale: 4 })
  currentMultiplier!: string;

  @Property({ type: 'numeric', precision: 10, scale: 4 })
  crashPoint!: string;

  @Property({ length: 64 })
  hashedSeed!: string;

  @Property({ length: 64 })
  nonce!: string;

  @Property({ length: 64 })
  clientSeed!: string;

  @Property({ nullable: true })
  serverSeedRevealed!: string | null;

  @OneToMany(() => BetEntity, 'round', { orphanRemoval: false })
  bets = new Collection<BetEntity>(this);

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
