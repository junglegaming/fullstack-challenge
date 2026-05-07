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
  
  // 1. Pegamos os primeiros 13 caracteres (52 bits)
  const hs = hash.slice(0, 13);
  const int = parseInt(hs, 16);

  // 2. A fórmula clássica usada por sites como Bustabit/Blaze
  // Ela garante que a "casa" tenha 1% de vantagem e os resultados variem
  const e = Math.pow(2, 52);
  const result = Math.floor((100 * e - int) / (e - int)) / 100;

  // 3. Segurança: O crash mínimo é 1.00
  return Math.max(1, result);
}