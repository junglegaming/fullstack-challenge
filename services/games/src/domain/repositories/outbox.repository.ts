import { OutboxEvent } from '../entities/outbox-event.entity';

export interface OutboxRepository {
  save(event: OutboxEvent): Promise<void>;
  findPending(limit: number): Promise<OutboxEvent[]>;
  markAsPublished(eventId: string): Promise<void>;
  incrementFailedAttempts(eventId: string): Promise<void>;
}
