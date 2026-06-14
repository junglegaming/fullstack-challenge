export const PROVABLY_FAIR_ALGORITHM = "HMAC_SHA256_SHA256_HASH_COMMITMENT";
export const DEFAULT_CLIENT_SEED = "crash-game-public-seed";
export const HOUSE_EDGE_PERCENT = 1;
export const HOUSE_EDGE_BASIS_POINTS = 100n;
export const CRASH_POINT_SCALE = 100n;
export const UINT52_SPACE = 2n ** 52n;

export const PROVABLY_FAIR_TEST_FIXTURE = {
  serverSeed:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  clientSeed: DEFAULT_CLIENT_SEED,
  nonce: 42,
  expectedServerSeedHash:
    "a8ae6e6ee929abea3afcfc5258c8ccd6f85273e0d4626d26c7279f3250f77c8e",
  expectedCrashPointBps: 107,
  expectedCrashPointDisplay: "1.07",
} as const;
