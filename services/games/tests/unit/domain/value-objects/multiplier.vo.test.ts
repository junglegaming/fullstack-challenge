import { describe, it, expect } from 'bun:test';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { Money } from '@/domain/value-objects/money.vo';

describe('Multiplier', () => {
  describe('creation', () => {
    it('creates from number', () => {
      const m = new Multiplier(1.5);
      expect(m.raw).toBe(1.5);
    });

    it('creates from string', () => {
      const m = new Multiplier('2.25');
      expect(m.raw).toBeCloseTo(2.25);
    });

    it('rejects multiplier less than 1.0', () => {
      expect(() => new Multiplier(0.9)).toThrow('Multiplier must be greater than or equal to 1.0');
    });

    it('rejects non-finite number', () => {
      expect(() => new Multiplier(NaN)).toThrow('Multiplier must be a finite number');
    });
  });

  describe('toDecimalString', () => {
    it('returns decimal string with 4 decimal places', () => {
      const m = new Multiplier(1.5);
      expect(m.toDecimalString()).toBe('1.5000');
    });

    it('handles integer multiplier', () => {
      const m = new Multiplier(2);
      expect(m.toDecimalString()).toBe('2.0000');
    });
  });

  describe('comparison', () => {
    it('isGreaterThanOrEqual', () => {
      const a = new Multiplier(2.0);
      const b = new Multiplier(1.5);
      expect(a.isGreaterThanOrEqual(b)).toBe(true);
      expect(b.isGreaterThanOrEqual(a)).toBe(false);
      expect(a.isGreaterThanOrEqual(a)).toBe(true);
    });

    it('isLessThan', () => {
      const a = new Multiplier(1.5);
      const b = new Multiplier(2.0);
      expect(a.isLessThan(b)).toBe(true);
    });
  });

  describe('integration with Money', () => {
    it('multiplies money correctly', () => {
      const money = new Money(1000n); // 10.00
      const multiplier = new Multiplier(1.5);
      const result = money.multiply(multiplier.toDecimalString());
      expect(result.amount).toBe(1500n); // 15.00
    });
  });
});
