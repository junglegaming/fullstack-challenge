import { describe, it, expect } from 'bun:test';
import { PlayerId } from '@/domain/value-objects/player-id.vo';

describe('PlayerId', () => {
  it('creates with valid value', () => {
    const id = new PlayerId('player-123');
    expect(id.raw).toBe('player-123');
  });

  it('rejects empty value', () => {
    expect(() => new PlayerId('')).toThrow('PlayerId cannot be empty');
  });

  it('rejects whitespace only', () => {
    expect(() => new PlayerId('   ')).toThrow('PlayerId cannot be empty');
  });

  it('equals works', () => {
    const a = new PlayerId('player-1');
    const b = new PlayerId('player-1');
    const c = new PlayerId('player-2');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
