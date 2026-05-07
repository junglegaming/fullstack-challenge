import { OutboxEvent } from '../../infrastructure/persistence/entities/outbox-event.entity';

export abstract class IOutboxRepository {
  abstract save(event: OutboxEvent): Promise<void>;
  abstract update(event: OutboxEvent): Promise<void>;
  abstract findPending(maxRetries: number): Promise<OutboxEvent[]>;
  abstract deletePublished(olderThan: Date): Promise<void>;
}
