import { describe, it, expect } from 'bun:test';
import { generateCrashPoint, verifyCrashPoint } from '@/domain/services/crash-point.service';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { createHash } from 'crypto';

function sha256(data: string): Uint8Array {
  const hash = createHash('sha256');
  hash.update(data);
  return new Uint8Array(hash.digest());
}

describe('generateCrashPoint', () => {
  const serverSeed = 'test-server-seed-123';
  const clientSeed = 'test-client-seed';
  const nonce = 'round-1';

  it('is deterministic: same inputs give same crash point', () => {
    const a = generateCrashPoint(serverSeed, clientSeed, nonce);
    const b = generateCrashPoint(serverSeed, clientSeed, nonce);
    expect(a.raw).toBe(b.raw);
  });

  it('produces crash point >= 1.0', () => {
    const crashPoint = generateCrashPoint(serverSeed, clientSeed, nonce);
    expect(crashPoint.raw).toBeGreaterThanOrEqual(1.0);
  });

  it('different nonces produce different crash points', () => {
    const cp1 = generateCrashPoint(serverSeed, clientSeed, 'round-1');
    const cp2 = generateCrashPoint(serverSeed, clientSeed, 'round-2');
    expect(cp1.raw).not.toBe(cp2.raw);
  });

  it('different client seeds produce different crash points', () => {
    const cp1 = generateCrashPoint(serverSeed, 'client-1', nonce);
    const cp2 = generateCrashPoint(serverSeed, 'client-2', nonce);
    expect(cp1.raw).not.toBe(cp2.raw);
  });

  it('different server seeds produce different crash points', () => {
    const cp1 = generateCrashPoint('seed-1', clientSeed, nonce);
    const cp2 = generateCrashPoint('seed-2', clientSeed, nonce);
    expect(cp1.raw).not.toBe(cp2.raw);
  });

  it('minimum crash point is 1.0 (when r=0)', () => {
    let minCp = Infinity;
    for (let i = 0; i < 10000; i++) {
      const cp = generateCrashPoint(serverSeed, clientSeed, `nonce-${i}`);
      if (cp.raw < minCp) minCp = cp.raw;
    }
    expect(minCp).toBe(1.0);
  });

  it('maximum crash point is ~9900x (when r=9999)', () => {
    let maxCp = 0;
    for (let i = 0; i < 10000; i++) {
      const cp = generateCrashPoint(serverSeed, clientSeed, `nonce-${i}`);
      if (cp.raw > maxCp) maxCp = cp.raw;
    }
    expect(maxCp).toBeCloseTo(9900, 0);
  });

  it('house edge reduces crash point by 1% vs fair value', () => {
    const nonce = 'round-house-edge';
    const cp = generateCrashPoint(serverSeed, clientSeed, nonce);

    // Recompute r from hash to verify the 0.99 multiplier
    const combined = `${serverSeed}|${clientSeed}|${nonce}`;
    const hashBytes = sha256(combined);
    let hashBigInt = 0n;
    for (let i = 0; i < 8; i++) {
      hashBigInt = (hashBigInt << 8n) | BigInt(hashBytes[i]);
    }
    const r = Number(hashBigInt % 10000n);
    const expected = Math.max(1.0, (1 / (1 - r / 10000)) * 0.99);

    expect(cp.raw).toBeCloseTo(expected, 10);
  });
});

describe('verifyCrashPoint', () => {
  const serverSeed = 'verify-test-seed';
  const clientSeed = 'client-1';
  const nonce = 'round-verify';
  const crashPoint = generateCrashPoint(serverSeed, clientSeed, nonce);

  const hashedSeed = Array.from(sha256(serverSeed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  it('returns true when all inputs match', () => {
    const result = verifyCrashPoint(serverSeed, clientSeed, nonce, crashPoint, hashedSeed);
    expect(result).toBe(true);
  });

  it('returns false when hashed seed does not match', () => {
    const wrongHashed = 'invalid-hash';
    const result = verifyCrashPoint(serverSeed, clientSeed, nonce, crashPoint, wrongHashed);
    expect(result).toBe(false);
  });

  it('returns false when crash point does not match', () => {
    const wrongCrash = new Multiplier(100.0);
    const result = verifyCrashPoint(serverSeed, clientSeed, nonce, wrongCrash, hashedSeed);
    expect(result).toBe(false);
  });

  it('returns false when server seed is wrong', () => {
    const wrongServerSeed = 'wrong-seed';
    const result = verifyCrashPoint(wrongServerSeed, clientSeed, nonce, crashPoint, hashedSeed);
    expect(result).toBe(false);
  });

  it('returns true with recomputed crash point', () => {
    const recomputed = generateCrashPoint(serverSeed, clientSeed, nonce);
    const result = verifyCrashPoint(serverSeed, clientSeed, nonce, recomputed, hashedSeed);
    expect(result).toBe(true);
  });
});
