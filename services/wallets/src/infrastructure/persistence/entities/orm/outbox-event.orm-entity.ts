import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

@Entity({ tableName: 'outbox_events' })
export class OutboxEventEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ length: 50 })
  @Index()
  eventType!: string;

  @Property({ type: 'json' })
  payload!: unknown;

  @Property({ length: 20 })
  status!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: true })
  publishedAt?: Date;

  @Property({ nullable: true, type: 'text' })
  errorMessage?: string;

  @Property()
  retryCount: number = 0;
}
