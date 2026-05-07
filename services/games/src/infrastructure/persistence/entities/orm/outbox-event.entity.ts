import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

@Entity({ tableName: 'outbox_events' })
export class OutboxEventEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ length: 50 })
  aggregateType!: string;

  @Property({ length: 255 })
  @Index()
  aggregateId!: string;

  @Property({ length: 50 })
  eventType!: string;

  @Property({ type: 'json' })
  payload!: Record<string, unknown>;

  @Property({ nullable: true })
  publishedAt!: Date | null;

  @Property({ default: 0 })
  failedAttempts!: number;

  @Property()
  createdAt: Date = new Date();
}
