import crypto from 'crypto'

export function generateServerSeed() {
  return crypto.randomBytes(32).toString(
    'hex',
  )
}

export function hashServerSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex');
}

export function calculateCrashPoint(seed: string): number {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  
  const hs = hash.slice(0, 13);
  const int = parseInt(hs, 16);

  const e = Math.pow(2, 52);
  const result = Math.floor((100 * e - int) / (e - int)) / 100;

  return Math.max(1, result);
}