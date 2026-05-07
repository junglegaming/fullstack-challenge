import { describe, it, expect } from 'bun:test';
import { Money } from '@/domain/value-objects/money.vo';

describe('Money (Games)', () => {
  describe('creation', () => {
    it('creates from bigint cents', () => {
      const money = new Money(1000n);
      expect(money.amount).toBe(1000n);
    });

    it('creates from number cents (integer)', () => {
      const money = new Money(1000);
      expect(money.amount).toBe(1000n);
    });

    it('creates from reais via factory', () => {
      const money = Money.fromReais(10.50);
      expect(money.amount).toBe(1050n);
    });

    it('creates zero', () => {
      const zero = Money.zero();
      expect(zero.amount).toBe(0n);
    });

    it('rejects negative cents', () => {
      expect(() => new Money(-100n)).toThrow('Money amount cannot be negative');
    });
  });

  describe('reaisString', () => {
    it('formats positive amount', () => {
      const money = new Money(1050n);
      expect(money.reaisString).toBe('10.50');
    });
  });

  describe('add', () => {
    it('adds two Money amounts', () => {
      const a = new Money(1000n);
      const b = new Money(500n);
      const result = a.add(b);
      expect(result.amount).toBe(1500n);
    });
  });

  describe('subtract', () => {
    it('subtracts smaller amount', () => {
      const a = new Money(1000n);
      const b = new Money(300n);
      const result = a.subtract(b);
      expect(result.amount).toBe(700n);
    });

    it('throws on insufficient funds', () => {
      const a = new Money(100n);
      const b = new Money(200n);
      expect(() => a.subtract(b)).toThrow('Insufficient funds');
    });
  });

  describe('multiply', () => {
    it('multiplies by bigint 2', () => {
      const money = new Money(1000n);
      const result = money.multiply(2n);
      expect(result.amount).toBe(2000n);
    });

    it('multiplies by string decimal 1.5', () => {
      const money = new Money(1000n);
      const result = money.multiply('1.5');
      expect(result.amount).toBe(1500n);
    });

    it('multiplies by number (converted to string)', () => {
      const money = new Money(1000n);
      const result = money.multiply(1.5); // number -> string "1.5"
      expect(result.amount).toBe(1500n);
    });

    it('throws on negative multiplier (produces negative amount)', () => {
      const money = new Money(1000n);
      expect(() => money.multiply(-1n)).toThrow('Money amount cannot be negative');
    });
  });

  describe('precision and floating-point avoidance', () => {
    it('proves float is dangerous: 0.1 + 0.2 !== 0.3', () => {
      const floatSum = 0.1 + 0.2;
      expect(floatSum === 0.3).toBe(false);
    });

    it('Money using bigint centavos avoids FP errors', () => {
      const money = new Money(1000n);
      const result = money.multiply('0.1');
      expect(result.amount).toBe(100n); // 1.00
    });
  });
});
