import { Round } from '../entities/round.entity';
import { OutboxEvent } from '../entities/outbox-event.entity';

export interface RoundRepository {
  getCurrent(): Promise<Round>;
  save(round: Round, events?: OutboxEvent[]): Promise<void>;
  findPendingOutboxEvents(limit: number): Promise<OutboxEvent[]>;
  markOutboxEventAsPublished(eventId: string): Promise<void>;
  incrementOutboxEventFailedAttempts(eventId: string): Promise<void>;
}
