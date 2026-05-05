export type OutboxEventStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

/**
 * OutboxEvent represents a domain event to be published to the message broker.
 * Stored before publishing to ensure at-least-once delivery.
 */
export class OutboxEvent {
  constructor(
    public readonly id: string,               // Unique ID (UUID)
    public readonly eventType: string,         // e.g., 'WalletUpdated', 'TransactionCreated'
    public readonly payload: unknown,
    public status: OutboxEventStatus = 'PENDING',
    public readonly createdAt: Date = new Date(),
    public publishedAt?: Date,
    public errorMessage?: string,
    public retryCount: number = 0,
  ) {}

  markAsPublished(): void {
    this.status = 'PUBLISHED';
    this.publishedAt = new Date();
  }

  markAsFailed(error: Error, maxRetries: number): void {
    this.retryCount++;
    if (this.retryCount >= maxRetries) {
      this.status = 'FAILED';
    }
    this.errorMessage = error.message;
  }

  canRetry(maxRetries: number): boolean {
    return this.status === 'PENDING' || (this.status === 'FAILED' && this.retryCount < maxRetries);
  }
}
