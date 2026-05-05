import { InboxEvent } from '../../infrastructure/persistence/entities/inbox-event.entity';

export interface IInboxRepository {
  findById(id: string): Promise<InboxEvent | null>;
  save(event: InboxEvent): Promise<void>;
  update(event: InboxEvent): Promise<void>;
  findPending(maxRetries: number): Promise<InboxEvent[]>;
}
