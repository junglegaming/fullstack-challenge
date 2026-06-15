const DEFAULT_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 2_000;

type HealthCheck = {
  name: string;
  url: string;
  validate?: (response: Response) => Promise<boolean> | boolean;
};

const CHECKS: HealthCheck[] = [
  {
    name: "Keycloak",
    url: "http://localhost:8080/realms/crash-game/.well-known/openid-configuration",
    validate: async (response) => response.ok,
  },
  {
    name: "Kong proxy",
    url: "http://localhost:8000/games/rounds/current",
    validate: async (response) => response.ok,
  },
  {
    name: "Games service",
    url: "http://localhost:4001/health",
    validate: async (response) => response.ok,
  },
  {
    name: "Wallets service",
    url: "http://localhost:4002/health",
    validate: async (response) => response.ok,
  },
  {
    name: "Frontend",
    url: "http://localhost:3000/",
    validate: async (response) => response.ok,
  },
  {
    name: "RabbitMQ management",
    url: "http://localhost:15672/",
    validate: async (response) => response.ok,
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForDockerStack(
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const pending = new Set(CHECKS.map((check) => check.name));

  while (pending.size > 0) {
    if (Date.now() > deadline) {
      throw new Error(
        `Docker stack validation timed out. Unhealthy: ${[...pending].join(", ")}`,
      );
    }

    for (const check of CHECKS) {
      if (!pending.has(check.name)) {
        continue;
      }

      try {
        const response = await fetch(check.url);
        const isHealthy = check.validate
          ? await check.validate(response)
          : response.ok;

        if (isHealthy) {
          pending.delete(check.name);
          console.log(`✓ ${check.name}`);
        }
      } catch {
        // Keep polling until timeout.
      }
    }

    if (pending.size > 0) {
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

if (import.meta.main) {
  const timeoutMs = Number(process.env.DOCKER_VALIDATE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  console.log("Validating Docker stack...");
  await waitForDockerStack(timeoutMs);
  console.log("All services are healthy.");
}
