import { OutboxEventId } from '../value-objects/outbox-event-id.vo';

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export class OutboxEvent {
  private publishedAt: Date | null = null;
  private failedAttempts: number = 0;

  constructor(
    private readonly id: OutboxEventId,
    private readonly aggregateType: string,
    private readonly aggregateId: string,
    private readonly eventType: string,
    private readonly payload: Record<string, unknown>,
    private readonly createdAt: Date = new Date(),
  ) {}

  get eventId(): OutboxEventId {
    return this.id;
  }

  get status(): OutboxStatus {
    if (this.publishedAt) return 'PUBLISHED';
    if (this.failedAttempts > 0) return 'FAILED';
    return 'PENDING';
  }

  get eventPayload(): Record<string, unknown> {
    return this.payload;
  }

  get eventType(): string {
    return this.eventType;
  }

  get aggregateType(): string {
    return this.aggregateType;
  }

  get aggregateId(): string {
    return this.aggregateId;
  }

  get createdAt(): Date {
    return this.createdAt;
  }

  markAsPublished(): void {
    this.publishedAt = new Date();
  }

  incrementFailedAttempts(): void {
    this.failedAttempts++;
  }

  get failedAttemptsCount(): number {
    return this.failedAttempts;
  }

  get isPublished(): boolean {
    return this.publishedAt !== null;
  }
}
