export class CrashService {
  generate(): number {
    const r = Math.random();

    return Math.max(1, (1 / (1 - r)) * 0.99);
  }
}