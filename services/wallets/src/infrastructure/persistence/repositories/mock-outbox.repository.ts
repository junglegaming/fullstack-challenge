import { Injectable } from '@nestjs/common';
import { OutboxEvent } from '../../persistence/entities/outbox-event.entity';
import { IOutboxRepository } from '../../../application/ports/outbox-repository.port';

@Injectable()
export class MockOutboxRepository implements IOutboxRepository {
  private events: Map<string, OutboxEvent> = new Map();

  async save(event: OutboxEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async update(event: OutboxEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async findPending(maxRetries: number): Promise<OutboxEvent[]> {
    return Array.from(this.events.values()).filter(
      e => e.status !== 'PUBLISHED' && e.retryCount < maxRetries,
    );
  }

  async deletePublished(olderThan: Date): Promise<void> {
    for (const [id, event] of this.events.entries()) {
      if (event.status === 'PUBLISHED' && event.publishedAt && event.publishedAt < olderThan) {
        this.events.delete(id);
      }
    }
  }
}
