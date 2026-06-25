export const SEED_CHAIN_PROVIDER = Symbol("SEED_CHAIN_PROVIDER");

export interface SeedForNonce {
  serverSeed: string;
  serverSeedHash: string;
}

export interface SeedChainProvider {

  ensureInitialized(): Promise<void>;
  getSeedForNonce(nonce: number): Promise<SeedForNonce>;
}
