import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureEnvFiles } from "./ensure-env";

const TEMP_ROOT = join(import.meta.dir, ".tmp-ensure-env");

afterEach(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true });
});

describe("ensureEnvFiles", () => {
  it("creates missing .env files from .env.example templates", () => {
    const gamesDir = join(TEMP_ROOT, "services/games");
    const walletsDir = join(TEMP_ROOT, "services/wallets");
    const frontendDir = join(TEMP_ROOT, "frontend");

    mkdirSync(gamesDir, { recursive: true });
    mkdirSync(walletsDir, { recursive: true });
    mkdirSync(frontendDir, { recursive: true });

    writeFileSync(join(gamesDir, ".env.example"), "PORT=4001\n");
    writeFileSync(join(walletsDir, ".env.example"), "PORT=4002\n");
    writeFileSync(join(frontendDir, ".env.example"), "VITE_API_BASE_URL=http://localhost:8000\n");

    const created = ensureEnvFiles(TEMP_ROOT);

    expect(created).toEqual([
      "services/games/.env",
      "services/wallets/.env",
      "frontend/.env",
    ]);
    expect(readFileSync(join(gamesDir, ".env"), "utf8")).toBe("PORT=4001\n");
    expect(readFileSync(join(walletsDir, ".env"), "utf8")).toBe("PORT=4002\n");
    expect(readFileSync(join(frontendDir, ".env"), "utf8")).toBe(
      "VITE_API_BASE_URL=http://localhost:8000\n",
    );
  });

  it("does not overwrite existing .env files", () => {
    const gamesDir = join(TEMP_ROOT, "services/games");
    const walletsDir = join(TEMP_ROOT, "services/wallets");
    const frontendDir = join(TEMP_ROOT, "frontend");

    mkdirSync(gamesDir, { recursive: true });
    mkdirSync(walletsDir, { recursive: true });
    mkdirSync(frontendDir, { recursive: true });

    writeFileSync(join(gamesDir, ".env.example"), "PORT=4001\n");
    writeFileSync(join(walletsDir, ".env.example"), "PORT=4002\n");
    writeFileSync(join(frontendDir, ".env.example"), "VITE_API_BASE_URL=http://localhost:8000\n");
    writeFileSync(join(gamesDir, ".env"), "PORT=9999\n");

    const created = ensureEnvFiles(TEMP_ROOT);

    expect(created).toEqual(["services/wallets/.env", "frontend/.env"]);
    expect(readFileSync(join(gamesDir, ".env"), "utf8")).toBe("PORT=9999\n");
    expect(existsSync(join(walletsDir, ".env"))).toBe(true);
  });
});
