import { createHash } from 'crypto';
import { Multiplier } from '../value-objects/multiplier.vo';

const HOUSE_EDGE = 0.01;

function sha256(data: string): Uint8Array {
  const hash = createHash('sha256');
  hash.update(data);
  return new Uint8Array(hash.digest());
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function combineInputs(serverSeed: string, clientSeed: string, nonce: string): string {
  return `${serverSeed}|${clientSeed}|${nonce}`;
}

export function generateCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: string,
): Multiplier {
  const combined = combineInputs(serverSeed, clientSeed, nonce);
  const hashBytes = sha256(combined);

  let hashBigInt = 0n;
  for (let i = 0; i < 8; i++) {
    hashBigInt = (hashBigInt << 8n) | BigInt(hashBytes[i]);
  }

  const r = Number(hashBigInt % 10000n);
  const denominator = 1 - r / 10000;
  const crashValue = Math.max(1.0, (1 / denominator) * (1 - HOUSE_EDGE));

  return new Multiplier(crashValue);
}

export function verifyCrashPoint(
  revealedServerSeed: string,
  clientSeed: string,
  nonce: string,
  expectedCrashPoint: Multiplier,
  expectedHashedSeed: string,
): boolean {
  const computedHashedSeed = bytesToHex(sha256(revealedServerSeed));
  if (computedHashedSeed !== expectedHashedSeed) return false;

  const recomputed = generateCrashPoint(revealedServerSeed, clientSeed, nonce);
  return Math.abs(recomputed.raw - expectedCrashPoint.raw) < 0.0001;
}

export { bytesToHex };
