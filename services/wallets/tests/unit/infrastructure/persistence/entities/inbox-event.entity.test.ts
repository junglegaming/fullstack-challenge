import { describe, it, expect, beforeEach } from 'bun:test';
import { InboxEvent } from '@/infrastructure/persistence/entities/inbox-event.entity';

describe('InboxEvent', () => {
  let event: InboxEvent;

  beforeEach(() => {
    event = new InboxEvent(
      'msg-123',
      'BetPlaced',
      { playerId: 'player-1', amountCents: 1000n, betId: 'bet-1' },
      'PENDING',
    );
  });

  it('starts as PENDING', () => {
    expect(event.status).toBe('PENDING');
    expect(event.retryCount).toBe(0);
  });

  it('markAsProcessed sets status to PROCESSED and stores result', () => {
    const result = { transactionId: 'txn-1', newBalanceCents: 9000n };
    event.markAsProcessed(result);
    expect(event.status).toBe('PROCESSED');
    expect(event.processedAt).toBeDefined();
    expect(event.result).toEqual(result);
  });

  it('markAsFailed increments retryCount', () => {
    const error = new Error('Test error');
    event.markAsFailed(error, 3);
    expect(event.retryCount).toBe(1);
    expect(event.errorMessage).toBe('Test error');
  });

  it('markAsFailed sets status to FAILED after max retries', () => {
    const error = new Error('Test error');
    event.markAsFailed(error, 3);
    event.markAsFailed(error, 3);
    event.markAsFailed(error, 3);
    expect(event.status).toBe('FAILED');
  });

  it('canRetry returns true for PENDING', () => {
    expect(event.canRetry(3)).toBe(true);
  });

  it('canRetry returns true for FAILED with retries left', () => {
    event.markAsFailed(new Error('err'), 3);
    expect(event.canRetry(3)).toBe(true);
  });

  it('canRetry returns false for FAILED with max retries', () => {
    event.markAsFailed(new Error('err'), 3);
    event.markAsFailed(new Error('err'), 3);
    event.markAsFailed(new Error('err'), 3);
    expect(event.canRetry(3)).toBe(false);
  });
});
