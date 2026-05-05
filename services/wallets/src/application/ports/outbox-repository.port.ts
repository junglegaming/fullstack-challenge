import { OutboxEvent } from '../../infrastructure/persistence/entities/outbox-event.entity';

export interface IOutboxRepository {
  save(event: OutboxEvent): Promise<void>;
  update(event: OutboxEvent): Promise<void>;
  findPending(maxRetries: number): Promise<OutboxEvent[]>;
  deletePublished(olderThan: Date): Promise<void>;
}
