import { RoundRepository } from '@/domain/repositories/round.repository';
import { OutboxEvent } from '@/domain/entities/outbox-event.entity';
import { IEventBus } from '@/application/ports/event-bus.port';

const POLLING_INTERVAL_MS = 5000;
const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_BACKOFF_MS = 2000;

export class OutboxWorker {
  private isRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly roundRepo: RoundRepository,
    private readonly eventBus: IEventBus,
  ) {}

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      await this.processPendingEvents();
    }, POLLING_INTERVAL_MS);

    this.processPendingEvents();
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private async processPendingEvents(): Promise<void> {
    const pendingEvents = await this.roundRepo.findPendingOutboxEvents(50);

    for (const event of pendingEvents) {
      await this.publishEvent(event);
    }
  }

  private async publishEvent(event: OutboxEvent): Promise<void> {
    const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, event.failedAttemptsCount);

    try {
      await this.eventBus.publish({
        type: event.eventType,
        payload: event.eventPayload,
      });

      await this.roundRepo.markOutboxEventAsPublished(event.eventId.raw());
    } catch (error) {
      console.error(`Failed to publish event ${event.eventId.raw()}:`, error);
      await this.roundRepo.incrementOutboxEventFailedAttempts(event.eventId.raw());

      if (event.failedAttemptsCount >= MAX_RETRY_ATTEMPTS) {
        console.error(`Event ${event.eventId.raw()} exceeded max retry attempts`);
      }
    }
  }
}
