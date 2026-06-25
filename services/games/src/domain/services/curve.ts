export function multiplierValueAt(
  elapsedMs: number,
  growthRatePerMs: number,
): number {
  return Math.exp(growthRatePerMs * elapsedMs);
}

export function crashElapsedMs(
  crashPointValue: number,
  growthRatePerMs: number,
): number {
  return Math.log(crashPointValue) / growthRatePerMs;
}
