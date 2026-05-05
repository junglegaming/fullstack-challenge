import { describe, it, expect } from 'bun:test';
import { WalletId } from '@/domain/value-objects/wallet-id.vo';

describe('WalletId', () => {
  it('creates with valid value', () => {
    const id = new WalletId('wallet-123');
    expect(id.raw).toBe('wallet-123');
  });

  it('rejects empty value', () => {
    expect(() => new WalletId('')).toThrow('WalletId cannot be empty');
  });

  it('rejects whitespace only', () => {
    expect(() => new WalletId('   ')).toThrow('WalletId cannot be empty');
  });

  it('equals works', () => {
    const a = new WalletId('wallet-1');
    const b = new WalletId('wallet-1');
    const c = new WalletId('wallet-2');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
