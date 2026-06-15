import { E2E_CONFIG } from "./config";

export async function waitFor<T>(
  description: string,
  predicate: () => Promise<T | null | undefined | false>,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? E2E_CONFIG.defaultTimeoutMs;
  const intervalMs = options?.intervalMs ?? E2E_CONFIG.pollIntervalMs;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = await predicate();

    if (result) {
      return result;
    }

    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for: ${description}`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
