import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

@Entity({ tableName: 'inbox_events' })
export class InboxEventEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ length: 50 })
  @Index()
  eventType!: string;

  @Property({ type: 'json' })
  payload!: Record<string, unknown>;

  @Property({ length: 20 })
  status!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: true })
  processedAt?: Date;

  @Property({ nullable: true, type: 'text' })
  errorMessage?: string;

  @Property()
  retryCount: number = 0;

  @Property({ type: 'json', nullable: true })
  result?: { transactionId: string; newBalanceCents: string };
}
