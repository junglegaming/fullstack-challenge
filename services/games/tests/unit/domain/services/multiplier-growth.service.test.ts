import { describe, it, expect } from 'bun:test';
import { getMultiplierAt } from '@/domain/services/multiplier-growth.service';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';

describe('getMultiplierAt', () => {
  describe('initial value', () => {
    it('returns 1.0x at t=0ms', () => {
      const multiplier = getMultiplierAt(0);
      expect(multiplier.raw).toBeCloseTo(1.0, 10);
    });
  });

  describe('monotonic growth', () => {
    it('multiplier increases as time increases', () => {
      const m0 = getMultiplierAt(0);
      const m1000 = getMultiplierAt(1000);
      const m5000 = getMultiplierAt(5000);
      const m10000 = getMultiplierAt(10000);

      expect(m0.raw).toBeLessThan(m1000.raw);
      expect(m1000.raw).toBeLessThan(m5000.raw);
      expect(m5000.raw).toBeLessThan(m10000.raw);
    });

    it('is strictly monotonic for any t1 < t2', () => {
      const points = [0, 100, 500, 1000, 2500, 5000, 10000, 30000];

      for (let i = 1; i < points.length; i++) {
        const prev = getMultiplierAt(points[i - 1]);
        const curr = getMultiplierAt(points[i]);
        expect(prev.raw).toBeLessThan(curr.raw);
      }
    });
  });

  describe('determinism / precision', () => {
    it('returns the same value for the same input', () => {
      const a = getMultiplierAt(5000);
      const b = getMultiplierAt(5000);

      expect(a.raw).toBe(b.raw);
    });

    it('produces consistent results across multiple calls', () => {
      const results = Array.from({ length: 10 }, () => getMultiplierAt(7000).raw);
      const first = results[0];
      for (const r of results) {
        expect(r).toBe(first);
      }
    });
  });

  describe('growth rate', () => {
    it('at 10s (~10,000ms) is approximately 1.82x', () => {
      const multiplier = getMultiplierAt(10000);
      expect(multiplier.raw).toBeCloseTo(1.822, 3);
    });

    it('at 30s (~30,000ms) is approximately 6.05x', () => {
      const multiplier = getMultiplierAt(30000);
      expect(multiplier.raw).toBeCloseTo(6.050, 3);
    });

    it('at 60s (~60,000ms) is approximately 36.60x', () => {
      const multiplier = getMultiplierAt(60000);
      expect(multiplier.raw).toBeCloseTo(36.598, 3);
    });
  });

  describe('edge cases', () => {
    it('throws when time is negative', () => {
      expect(() => getMultiplierAt(-100)).toThrow('Elapsed time cannot be negative');
    });

    it('small positive time returns value close to 1.0', () => {
      const multiplier = getMultiplierAt(1); // 1ms
      expect(multiplier.raw).toBeGreaterThan(1.0);
      expect(multiplier.raw).toBeLessThan(1.001);
    });
  });

  describe('Multiplier value object integration', () => {
    it('returns a Multiplier instance', () => {
      const multiplier = getMultiplierAt(5000);
      expect(multiplier).toBeInstanceOf(Multiplier);
    });

    it('enforces multiplier >= 1.0', () => {
      const multiplier = getMultiplierAt(0);
      expect(multiplier.raw).toBeGreaterThanOrEqual(1.0);
    });
  });
});
