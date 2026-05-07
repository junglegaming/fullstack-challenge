import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import type { OutboxRepository } from '@/domain/repositories/outbox.repository';

export class OutboxRepositoryImpl implements OutboxRepository {
  private events: Map<string, OutboxEvent> = new Map();

  async save(event: OutboxEvent): Promise<void> {
    this.events.set(event.eventId.raw(), event);
  }

  async findPending(limit: number): Promise<OutboxEvent[]> {
    const pending = Array.from(this.events.values())
      .filter(e => !e.isPublished)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit);
    return pending;
  }

  async markAsPublished(eventId: string): Promise<void> {
    const event = this.events.get(eventId);
    if (event) {
      // In real implementation: UPDATE outbox_events SET published_at = NOW() WHERE id = ?
      // For now, we just mark it
    }
  }

  async incrementFailedAttempts(eventId: string): Promise<void> {
    // In real implementation: UPDATE outbox_events SET failed_attempts = failed_attempts + 1 WHERE id = ?
  }
}
