// k chosen so the multiplier doubles every 10 seconds: e^(k*10) = 2 → k = ln(2)/10
const K = Math.log(2) / 10;

export class MultiplierCalculator {
  static calculate(startedAt: Date, now: Date = new Date()): number {
    const elapsedMs = now.getTime() - startedAt.getTime();
    if (elapsedMs <= 0) return 1.0;
    const elapsedS = elapsedMs / 1000;
    return Math.floor(Math.exp(K * elapsedS) * 100) / 100;
  }
}
