import { createHash, createHmac } from "node:crypto";

const HASH_PREFIX_BITS = 52;
const E = 2 ** HASH_PREFIX_BITS;

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function serverSeedHash(serverSeed: string): string {
  return sha256Hex(serverSeed);
}

export function crashPointHundredths(
  serverSeed: string,
  nonce: number,
  options: { houseEdge: number; maxHundredths: number },
): number {

  const hmac = createHmac("sha256", serverSeed)
    .update(`crash:${nonce}`)
    .digest("hex");

  const h = Number.parseInt(hmac.slice(0, 13), 16);
  const x = h / E;

  const raw = (1 - options.houseEdge) / (1 - x);
  const hundredths = Math.floor(raw * 100);
  return Math.min(options.maxHundredths, Math.max(100, hundredths));
}

export function verifyRound(params: {
  serverSeed: string;
  serverSeedHash: string;
  nonce: number;
  crashPointHundredths: number;
  houseEdge: number;
  maxHundredths: number;
}): { hashMatches: boolean; crashMatches: boolean; valid: boolean } {

  const hashMatches = serverSeedHash(params.serverSeed) === params.serverSeedHash;

  const recomputed = crashPointHundredths(params.serverSeed, params.nonce, {
    houseEdge: params.houseEdge,
    maxHundredths: params.maxHundredths,
  });
  const crashMatches = recomputed === params.crashPointHundredths;
  return { hashMatches, crashMatches, valid: hashMatches && crashMatches };
}
