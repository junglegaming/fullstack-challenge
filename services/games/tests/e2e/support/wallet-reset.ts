import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { E2E_CONFIG } from "./config";

const REPO_ROOT = join(import.meta.dir, "../../../../../");
const DEFAULT_INITIAL_BALANCE_CENTS = "100000";

export function resetTestPlayerWalletBalance(
  balanceCents: string = DEFAULT_INITIAL_BALANCE_CENTS,
): void {
  const sql = `UPDATE wallets SET "balanceCents" = ${balanceCents} WHERE "playerId" = '${E2E_CONFIG.testPlayerId}';`;

  const dockerResult = spawnSync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "admin",
      "-d",
      "wallets",
      "-c",
      sql,
    ],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );

  if (dockerResult.status === 0) {
    return;
  }

  throw new Error(
    `Failed to reset test player wallet balance: ${dockerResult.stderr || dockerResult.stdout || "unknown error"}`,
  );
}
