import { Round } from '@/domain/entities/round.entity';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { RoundRepository } from '@/domain/repositories/round.repository';

export class RoundRepositoryImpl implements RoundRepository {
  private currentRound: Round | null = null;
  private outboxEvents: OutboxEvent[] = [];

  async getCurrent(): Promise<Round> {
    if (!this.currentRound) {
      throw new Error('No active round found');
    }
    return this.currentRound;
  }

  async save(round: Round, events: OutboxEvent[] = []): Promise<void> {
    // In a real implementation, this would be a DB transaction:
    // BEGIN;
    //   UPDATE rounds SET ... WHERE id = ?;
    //   INSERT INTO outbox_events (...) VALUES (...);
    // COMMIT;

    this.currentRound = round;

    for (const event of events) {
      this.outboxEvents.push(event);
    }
  }

  async findPendingOutboxEvents(limit: number): Promise<OutboxEvent[]> {
    return this.outboxEvents
      .filter(e => !e.isPublished)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit);
  }

  async markOutboxEventAsPublished(eventId: string): Promise<void> {
    const event = this.outboxEvents.find(e => e.eventId.raw() === eventId);
    if (event) {
      // In real implementation: UPDATE outbox_events SET published_at = NOW() WHERE id = ?
    }
  }

  async incrementOutboxEventFailedAttempts(eventId: string): Promise<void> {
    // In real implementation: UPDATE outbox_events SET failed_attempts = failed_attempts + 1 WHERE id = ?
  }

  setCurrentRound(round: Round): void {
    this.currentRound = round;
  }
}
