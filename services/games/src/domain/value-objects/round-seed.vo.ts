import { createHash } from 'crypto';
import { Multiplier } from './multiplier.vo';
import { generateCrashPoint, bytesToHex } from '../services/crash-point.service';

function sha256(data: string): Uint8Array {
  const hash = createHash('sha256');
  hash.update(data);
  return new Uint8Array(hash.digest());
}

export class RoundSeed {
  private constructor(
    public readonly hashedSeed: string,
    public readonly nonce: string,
    public readonly clientSeed: string,
    private serverSeed: string | null,
    public readonly crashPoint: Multiplier,
  ) {}

  static create(serverSeed: string, nonce: string, clientSeed = ''): RoundSeed {
    const hashedSeed = bytesToHex(sha256(serverSeed));
    const crashPoint = generateCrashPoint(serverSeed, clientSeed, nonce);
    return new RoundSeed(hashedSeed, nonce, clientSeed, serverSeed, crashPoint);
  }

  reveal(): string {
    if (this.serverSeed === null) {
      throw new Error('Server seed already revealed');
    }
    const seed = this.serverSeed;
    this.serverSeed = null;
    return seed;
  }

  get isRevealed(): boolean {
    return this.serverSeed === null;
  }
}
