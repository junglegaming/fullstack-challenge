import { describe, it, expect } from 'bun:test';
import { TransactionId } from '@/domain/value-objects/transaction-id.vo';

describe('TransactionId', () => {
  it('creates with valid value', () => {
    const id = new TransactionId('txn-123');
    expect(id.raw).toBe('txn-123');
  });

  it('rejects empty value', () => {
    expect(() => new TransactionId('')).toThrow('TransactionId cannot be empty');
  });

  it('rejects whitespace only', () => {
    expect(() => new TransactionId('   ')).toThrow('TransactionId cannot be empty');
  });

  it('equals works', () => {
    const a = new TransactionId('txn-1');
    const b = new TransactionId('txn-1');
    const c = new TransactionId('txn-2');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
