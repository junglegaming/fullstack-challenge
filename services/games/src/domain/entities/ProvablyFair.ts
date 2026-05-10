import * as crypto from "crypto";
import { CrashSeed } from "../value-objects/CrashSeed";

export class ProvablyFair {
  private static readonly HOUSE_EDGE = 0.99;

  static generateServerSeed(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  static hashServerSeed(serverSeed: string): string {
    return crypto.createHash("sha256").update(serverSeed).digest("hex");
  }

  static createSeed(clientSeed: string, nonce: number, serverSeed?: string): CrashSeed {
    const finalServerSeed = serverSeed ?? this.generateServerSeed();
    const serverSeedHash = this.hashServerSeed(finalServerSeed);

    return CrashSeed.create({ serverSeed: finalServerSeed, serverSeedHash, clientSeed, nonce });
  }

  static calculateCrashPoint(seed: CrashSeed): number {
    const hmac = crypto
      .createHmac("sha256", seed.serverSeed)
      .update(`${seed.clientSeed}:${seed.nonce}`)
      .digest("hex");

    const h = parseInt(hmac.slice(0, 8), 16);
    const e = Math.pow(2, 32);

    if (h % 33 === 0) return 1.0;

    const crashPoint =
      Math.floor(((e * this.HOUSE_EDGE) / (e - h)) * 100) / 100;
    return Math.max(1.0, crashPoint);
  }

  static verify(
    serverSeed: string,
    clientSeed: string,
    nonce: number,
    claimedCrashPoint: number,
  ): boolean {
    const serverSeedHash = this.hashServerSeed(serverSeed);
    const seed = CrashSeed.create({
      serverSeed,
      serverSeedHash,
      clientSeed,
      nonce,
    });
    const expected = this.calculateCrashPoint(seed);
    return expected === claimedCrashPoint;
  }
}
