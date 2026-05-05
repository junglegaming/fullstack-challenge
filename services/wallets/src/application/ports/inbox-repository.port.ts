import { InboxEvent } from '../../infrastructure/persistence/entities/inbox-event.entity';

export abstract class IInboxRepository {
  abstract findById(id: string): Promise<InboxEvent | null>;
  abstract save(event: InboxEvent): Promise<void>;
  abstract update(event: InboxEvent): Promise<void>;
  abstract findPending(maxRetries: number): Promise<InboxEvent[]>;
}
