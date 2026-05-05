export type InboxEventStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface InboxEventResult {
  transactionId: string;
  newBalanceCents: bigint;
}

/**
 * InboxEvent represents a consumed event stored in the inbox table.
 * This ensures at-least-once delivery semantics by tracking processed messages.
 */
export class InboxEvent {
  constructor(
    public readonly id: string,
    public readonly eventType: string,
    public readonly payload: Record<string, unknown>,
    public status: InboxEventStatus = 'PENDING',
    public readonly createdAt: Date = new Date(),
    public processedAt?: Date,
    public errorMessage?: string,
    public retryCount: number = 0,
    public result?: InboxEventResult, // Store the result for idempotent returns
  ) {}

  markAsProcessed(result: InboxEventResult): void {
    this.status = 'PROCESSED';
    this.processedAt = new Date();
    this.result = result;
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
