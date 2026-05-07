import { describe, it, expect } from 'bun:test';
import { RoundSeed } from '@/domain/value-objects/round-seed.vo';
import { Multiplier } from '@/domain/value-objects/multiplier.vo';
import { createHash } from 'crypto';

function sha256(data: string): Uint8Array {
  const hash = createHash('sha256');
  hash.update(data);
  return new Uint8Array(hash.digest());
}

describe('RoundSeed', () => {
  const serverSeed = 'test-server-seed';
  const nonce = 'round-1';
  const clientSeed = 'client-1';

  describe('create', () => {
    it('generates hashed seed', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      expect(roundSeed.hashedSeed).toBeDefined();
      expect(roundSeed.hashedSeed.length).toBe(64);
    });

    it('hashed seed is SHA256 of server seed', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      const expectedHash = Array.from(sha256(serverSeed))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      expect(roundSeed.hashedSeed).toBe(expectedHash);
    });

    it('generates crash point', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      expect(roundSeed.crashPoint).toBeInstanceOf(Multiplier);
      expect(roundSeed.crashPoint.raw).toBeGreaterThanOrEqual(1.0);
    });

    it('stores nonce and client seed', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      expect(roundSeed.nonce).toBe(nonce);
      expect(roundSeed.clientSeed).toBe(clientSeed);
    });

    it('is not revealed initially', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      expect(roundSeed.isRevealed).toBe(false);
    });
  });

  describe('reveal', () => {
    it('returns the server seed', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      const revealed = roundSeed.reveal();
      expect(revealed).toBe(serverSeed);
    });

    it('sets isRevealed to true after reveal', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      roundSeed.reveal();
      expect(roundSeed.isRevealed).toBe(true);
    });

    it('throws if already revealed', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      roundSeed.reveal();
      expect(() => roundSeed.reveal()).toThrow('Server seed already revealed');
    });

    it('hashed seed remains available after reveal', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      const hashed = roundSeed.hashedSeed;
      roundSeed.reveal();
      expect(roundSeed.hashedSeed).toBe(hashed);
    });

    it('crash point remains available after reveal', () => {
      const roundSeed = RoundSeed.create(serverSeed, nonce, clientSeed);
      const cp = roundSeed.crashPoint;
      roundSeed.reveal();
      expect(roundSeed.crashPoint.raw).toBe(cp.raw);
    });
  });
});
