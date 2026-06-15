import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = join(import.meta.dir, "..");

const ENV_PAIRS = [
  { example: "services/games/.env.example", target: "services/games/.env" },
  { example: "services/wallets/.env.example", target: "services/wallets/.env" },
  { example: "frontend/.env.example", target: "frontend/.env" },
] as const;

export function ensureEnvFiles(rootDir: string = ROOT): string[] {
  const created: string[] = [];

  for (const { example, target } of ENV_PAIRS) {
    const examplePath = join(rootDir, example);
    const targetPath = join(rootDir, target);

    if (!existsSync(examplePath)) {
      throw new Error(`Missing environment template: ${example}`);
    }

    if (existsSync(targetPath)) {
      continue;
    }

    copyFileSync(examplePath, targetPath);
    created.push(target);
  }

  return created;
}

if (import.meta.main) {
  const created = ensureEnvFiles();

  for (const file of created) {
    console.log(`Created ${file} from ${file.replace(/\.env$/, ".env.example")}`);
  }

  if (created.length === 0) {
    console.log("Environment files already present.");
  }
}
