import { describe, it, expect } from 'bun:test';
import { Money } from '@/domain/value-objects/money.vo';

describe('Money', () => {
  describe('creation', () => {
    it('creates from bigint cents', () => {
      const money = new Money(1000n);
      expect(money.amount).toBe(1000n);
    });

    it('creates from number cents (integer)', () => {
      const money = new Money(1000);
      expect(money.amount).toBe(1000n);
    });

    it('creates from number cents (non-integer rounds to nearest cent)', () => {
      const money = new Money(1000.6);
      expect(money.amount).toBe(1001n); // rounds
    });

    it('creates from reais via factory', () => {
      const money = Money.fromReais(10.50);
      expect(money.amount).toBe(1050n);
    });

    it('creates from reais with fractional digits', () => {
      const money = Money.fromReais(0.01);
      expect(money.amount).toBe(1n);
    });

    it('creates zero', () => {
      const zero = Money.zero();
      expect(zero.amount).toBe(0n);
    });

    it('rejects negative cents (bigint)', () => {
      expect(() => new Money(-100n)).toThrow('Money amount cannot be negative');
    });

    it('rejects negative cents (number)', () => {
      expect(() => new Money(-100)).toThrow('Money amount cannot be negative');
    });

    it('rejects negative reais', () => {
      expect(() => Money.fromReais(-5)).toThrow('Money amount cannot be negative');
    });
  });

  describe('reaisString', () => {
    it('formats positive amount', () => {
      const money = new Money(1050n);
      expect(money.reaisString).toBe('10.50');
    });

    it('formats zero', () => {
      const money = Money.zero();
      expect(money.reaisString).toBe('0.00');
    });

    it('formats amount with single digit cents', () => {
      const money = new Money(1005n);
      expect(money.reaisString).toBe('10.05');
    });
  });

  describe('add', () => {
    it('adds two Money amounts', () => {
      const a = new Money(1000n);
      const b = new Money(500n);
      const result = a.add(b);
      expect(result.amount).toBe(1500n);
    });

    it('add zero', () => {
      const a = new Money(1000n);
      const result = a.add(Money.zero());
      expect(result.amount).toBe(1000n);
    });
  });

  describe('subtract', () => {
    it('subtracts smaller amount', () => {
      const a = new Money(1000n);
      const b = new Money(300n);
      const result = a.subtract(b);
      expect(result.amount).toBe(700n);
    });

    it('subtract exact amount results in zero', () => {
      const a = new Money(1000n);
      const result = a.subtract(new Money(1000n));
      expect(result.amount).toBe(0n);
    });

    it('throws on insufficient funds', () => {
      const a = new Money(100n);
      const b = new Money(200n);
      expect(() => a.subtract(b)).toThrow('Insufficient funds');
    });
  });

  describe('multiply', () => {
    describe('with bigint multiplier (exact integer)', () => {
      it('multiplies by 2', () => {
        const money = new Money(1000n);
        const result = money.multiply(2n);
        expect(result.amount).toBe(2000n);
      });

      it('multiplies by 1 (identity)', () => {
        const money = new Money(1000n);
        const result = money.multiply(1n);
        expect(result.amount).toBe(1000n);
      });
    });

    describe('with string decimal multiplier (precise)', () => {
      it('multiplies by 1.5', () => {
        const money = new Money(1000n); // 10.00
        const result = money.multiply('1.5');
        expect(result.amount).toBe(1500n); // 15.00
      });

      it('multiplies by 0.5', () => {
        const money = new Money(1000n);
        const result = money.multiply('0.5');
        expect(result.amount).toBe(500n); // 5.00
      });

      it('multiplies by 0.123 (three decimals)', () => {
        const money = new Money(1000n); // 10.00
        const result = money.multiply('0.123');
        // 10.00 * 0.123 = 1.23 -> 123 cents
        expect(result.amount).toBe(123n);
      });

      it('multiplies by 2.25', () => {
        const money = new Money(1000n);
        const result = money.multiply('2.25');
        expect(result.amount).toBe(2250n); // 22.50
      });

      it('handles multiplier with trailing zeros', () => {
        const money = new Money(1000n);
        const result = money.multiply('1.500'); // scale 3, but effectively 1.5
        expect(result.amount).toBe(1500n);
      });
    });

    describe('with number multiplier (converted via string to avoid FP)', () => {
      it('multiplies by 1.5 (number)', () => {
        const money = new Money(1000n);
        const result = money.multiply(1.5);
        // 1.5 as number is not exact, but we convert to string "1.5" which is exact.
        expect(result.amount).toBe(1500n);
      });

      it('multiplies by 0.1 (number) - potential FP pitfall avoided', () => {
        const money = new Money(1000n);
        // 0.1 as float is not exact, but we convert to string via toString() which yields "0.1"
        const result = money.multiply(0.1);
        // 10.00 * 0.1 = 1.00 -> 100 cents
        expect(result.amount).toBe(100n);
      });
    });

    it('throws on negative multiplier (bigint)', () => {
      // Our multiply doesn't explicitly check for negative multiplier, but the product would be negative cents which is rejected by constructor.
      const money = new Money(1000n);
      // Multiplying by -1n would produce negative amount, which constructor will reject.
      // We'll catch the error from constructor.
      expect(() => money.multiply(-1n)).toThrow('Money amount cannot be negative');
    });
  });

  describe('equals', () => {
    it('same amount returns true', () => {
      const a = new Money(1000n);
      const b = new Money(1000n);
      expect(a.equals(b)).toBe(true);
    });

    it('different amount returns false', () => {
      const a = new Money(1000n);
      const b = new Money(500n);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe('comparison', () => {
    it('isGreaterThan', () => {
      const a = new Money(1000n);
      const b = new Money(500n);
      expect(a.isGreaterThan(b)).toBe(true);
      expect(b.isGreaterThan(a)).toBe(false);
    });

    it('isLessThan', () => {
      const a = new Money(500n);
      const b = new Money(1000n);
      expect(a.isLessThan(b)).toBe(true);
      expect(b.isLessThan(a)).toBe(false);
    });
  });

  describe('precision and floating-point avoidance', () => {
    it('proves float is dangerous: 0.1 + 0.2 !== 0.3 in float', () => {
      // This test demonstrates why we don't use floats.
      const floatSum = 0.1 + 0.2;
      expect(floatSum === 0.3).toBe(false); // classic FP error
    });

    it('Money using bigint centavos avoids FP errors', () => {
      // 10.00 * 0.1 should be 1.00
      const money = new Money(1000n);
      const result = money.multiply('0.1'); // use string to be exact
      expect(result.amount).toBe(100n); // 1.00
    });

    it('avoids cumulative FP errors in repeated operations', () => {
      let money = new Money(1000n); // 10.00
      // Simulate 10 multiplications by 0.1 (10% of current) using string multiplier
      for (let i = 0; i < 10; i++) {
        money = money.multiply('0.1');
      }
      // 10.00 * 0.1^10 = very small, but integer cents will truncate to 0
      expect(money.amount).toBe(0n); // eventually becomes 0 cents due to truncation
    });
  });
});
