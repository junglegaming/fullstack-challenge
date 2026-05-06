import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/core';

@Entity({ tableName: 'bets' })
export class BetEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @ManyToOne(() => 'RoundEntity')
  round!: any;

  @Property({ length: 255 })
  @Index()
  playerId!: string;

  @Property({ type: 'bigint' })
  amountCents!: bigint;

  @Property({ length: 20 })
  status!: string;

  @Property({ type: 'numeric', precision: 10, scale: 4, nullable: true })
  cashoutMultiplier!: string | null;

  @Property({ type: 'bigint', nullable: true })
  payoutCents!: bigint | null;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
