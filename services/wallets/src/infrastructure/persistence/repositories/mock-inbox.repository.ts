import { Injectable } from '@nestjs/common';
import { InboxEvent } from '../../persistence/entities/inbox-event.entity';
import { IInboxRepository } from '../../../application/ports/inbox-repository.port';

@Injectable()
export class MockInboxRepository implements IInboxRepository {
  private events: Map<string, InboxEvent> = new Map();

  async findById(id: string): Promise<InboxEvent | null> {
    return this.events.get(id) || null;
  }

  async save(event: InboxEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async update(event: InboxEvent): Promise<void> {
    this.events.set(event.id, event);
  }

  async findPending(maxRetries: number): Promise<InboxEvent[]> {
    return Array.from(this.events.values()).filter(
      e => e.status !== 'PROCESSED' && e.retryCount < maxRetries,
    );
  }
}
