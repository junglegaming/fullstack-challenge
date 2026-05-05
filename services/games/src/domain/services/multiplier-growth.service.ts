import { Multiplier } from '../value-objects/multiplier.vo';

const GROWTH_RATE = 0.06;

export function getMultiplierAt(timeElapsedMs: number): Multiplier {
  if (timeElapsedMs < 0) {
    throw new Error('Elapsed time cannot be negative');
  }

  const timeElapsedSeconds = timeElapsedMs / 1000;
  const value = Math.exp(GROWTH_RATE * timeElapsedSeconds);
  return new Multiplier(value);
}
