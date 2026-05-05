import { describe, it, expect } from 'bun:test';
import { Money } from '@/domain/value-objects/money.vo';

describe('Money', () => {
  it('creates from number', () => {
    const money = new Money(1000);
    expect(money.amount).toBe(1000n);
  });

  it('creates from bigint', () => {
    const money = new Money(1000n);
    expect(money.amount).toBe(1000n);
  });

  it('creates from reais', () => {
    const money = Money.fromReais(10.50);
    expect(money.amount).toBe(1050n);
  });

  it('rejects negative amount', () => {
    expect(() => new Money(-100)).toThrow('Money amount cannot be negative');
  });

  it('adds correctly', () => {
    const a = new Money(1000);
    const b = new Money(500);
    const result = a.add(b);
    expect(result.amount).toBe(1500n);
  });

  it('subtracts correctly', () => {
    const a = new Money(1000);
    const b = new Money(300);
    const result = a.subtract(b);
    expect(result.amount).toBe(700n);
  });

  it('rejects subtraction that would result in negative', () => {
    const a = new Money(100);
    const b = new Money(200);
    expect(() => a.subtract(b)).toThrow('Insufficient funds');
  });

  it('multiplies correctly', () => {
    const money = new Money(1000);
    const result = money.multiply(1.5);
    expect(result.amount).toBe(1500n);
  });

  it('prevents negative multiplication', () => {
    expect(() => new Money(1000).multiply(-1)).toThrow('Multiplier cannot be negative');
  });

  it('equals works', () => {
    const a = new Money(1000);
    const b = new Money(1000);
    const c = new Money(500);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('zero returns zero money', () => {
    const zero = Money.zero();
    expect(zero.amount).toBe(0n);
  });
});
