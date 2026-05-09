import * as crypto from 'node:crypto';
import { calculateCrashPoint, hashServerSeed } from '../../src/domain/util/provably-fair';
import { describe, it } from 'node:test';
import { expect } from 'bun:test';

describe('Provably Fair Logic', () => {
  const mockSeed = '30f7d1d2e437c7d38e08ae5b57fac8941be37b0cb57a0b865dc33548e632e1fb';
  
  it('should be deterministic (same seed = same crash point)', () => {
    // 1. Calculamos o crash point duas vezes com a mesma seed
    const crash1 = calculateCrashPoint(mockSeed);
    const crash2 = calculateCrashPoint(mockSeed);

    // 2. O resultado TEM que ser idêntico
    expect(crash1).toBe(crash2);
    expect(crash1).toBe(2.82); // Exemplo baseado no seu log real!
  });

  it('should verify that hashServerSeed(seed) matches the hash', () => {
    const expectedHash = crypto.createHash('sha256').update(mockSeed).digest('hex');
    
    const resultHash = hashServerSeed(mockSeed);

    expect(resultHash).toBe(expectedHash);
  });

  it('should always return a crash point >= 1.00', () => {
    // Testamos com uma seed que sabemos que gera números baixos
    const lowSeed = '0000000000000000000000000000000000000000000000000000000000000001';
    const crash = calculateCrashPoint(lowSeed);

    expect(crash).toBeGreaterThanOrEqual(1.00);
  });
});