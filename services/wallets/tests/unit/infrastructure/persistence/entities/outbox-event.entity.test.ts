import { describe, it, expect, beforeEach } from 'bun:test';
import { OutboxEvent } from '@/infrastructure/persistence/entities/outbox-event.entity';

describe('OutboxEvent', () => {
  let event: OutboxEvent;

  beforeEach(() => {
    event = new OutboxEvent(
      'outbox-123',
      'WalletUpdated',
      { walletId: 'wallet-1', playerId: 'player-1', newBalanceCents: 9000n },
      'PENDING',
    );
  });

  it('starts as PENDING', () => {
    expect(event.status).toBe('PENDING');
    expect(event.retryCount).toBe(0);
  });

  it('markAsPublished sets status to PUBLISHED', () => {
    event.markAsPublished();
    expect(event.status).toBe('PUBLISHED');
    expect(event.publishedAt).toBeDefined();
  });

  it('markAsFailed increments retryCount', () => {
    const error = new Error('Test error');
    event.markAsFailed(error, 3);
    expect(event.retryCount).toBe(1);
    expect(event.errorMessage).toBe('Test error');
  });

  it('canRetry returns true for PENDING', () => {
    expect(event.canRetry(3)).toBe(true);
  });

  it('canRetry returns false for PUBLISHED', () => {
    event.markAsPublished();
    expect(event.canRetry(3)).toBe(false);
  });
});
