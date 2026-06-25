import { describe, expect, it } from "bun:test";
import { createHash, randomBytes } from "node:crypto";
import {
  crashPointHundredths,
  serverSeedHash,
  sha256Hex,
  verifyRound,
} from "../../src/domain/services/provably-fair";

const OPTS = { houseEdge: 0.01, maxHundredths: 100_000_000 };

describe("provably fair", () => {
  it("derives the crash point deterministically from seed + nonce", () => {
    const seed = "a".repeat(64);
    const a = crashPointHundredths(seed, 7, OPTS);
    const b = crashPointHundredths(seed, 7, OPTS);
    expect(a).toBe(b);
  });

  it("changes the crash point when the nonce changes", () => {
    const seed = "a".repeat(64);
    const a = crashPointHundredths(seed, 1, OPTS);
    const b = crashPointHundredths(seed, 2, OPTS);
    expect(a).not.toBe(b);
  });

  it("never produces a crash point below 1.00x and respects the cap", () => {
    for (let nonce = 0; nonce < 500; nonce++) {
      const value = crashPointHundredths("seed-" + nonce, nonce, OPTS);
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(OPTS.maxHundredths);
    }
  });

  it("verifies an honest round and rejects a tampered one", () => {
    const seed = randomBytes(32).toString("hex");
    const hash = serverSeedHash(seed);
    const crash = crashPointHundredths(seed, 42, OPTS);

    const ok = verifyRound({
      serverSeed: seed,
      serverSeedHash: hash,
      nonce: 42,
      crashPointHundredths: crash,
      ...OPTS,
    });
    expect(ok.valid).toBe(true);
    expect(ok.hashMatches).toBe(true);
    expect(ok.crashMatches).toBe(true);

    const tampered = verifyRound({
      serverSeed: seed,
      serverSeedHash: hash,
      nonce: 42,
      crashPointHundredths: crash + 1,
      ...OPTS,
    });
    expect(tampered.valid).toBe(false);
    expect(tampered.crashMatches).toBe(false);

    const wrongSeed = verifyRound({
      serverSeed: randomBytes(32).toString("hex"),
      serverSeedHash: hash,
      nonce: 42,
      crashPointHundredths: crash,
      ...OPTS,
    });
    expect(wrongSeed.hashMatches).toBe(false);
    expect(wrongSeed.valid).toBe(false);
  });

  it("forms a verifiable reverse hash chain (seed[i] = sha256(seed[i+1]))", () => {
    const length = 50;
    const chain = new Array<string>(length);
    chain[length - 1] = randomBytes(32).toString("hex");
    for (let i = length - 2; i >= 0; i--) {
      chain[i] = sha256Hex(chain[i + 1]);
    }

    for (let n = 1; n < length; n++) {
      expect(createHash("sha256").update(chain[n]).digest("hex")).toBe(
        chain[n - 1],
      );
    }
  });
});
