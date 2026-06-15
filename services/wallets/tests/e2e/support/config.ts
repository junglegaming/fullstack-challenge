export const E2E_CONFIG = {
  apiBaseUrl: process.env.E2E_API_BASE_URL ?? "http://localhost:8000",
  walletsBaseUrl: process.env.E2E_WALLETS_BASE_URL ?? "http://localhost:4002",
  keycloakTokenUrl:
    process.env.E2E_KEYCLOAK_TOKEN_URL ??
    "http://localhost:8080/realms/crash-game/protocol/openid-connect/token",
  keycloakClientId: process.env.E2E_KEYCLOAK_CLIENT_ID ?? "crash-game-client",
  keycloakUsername: process.env.E2E_KEYCLOAK_USERNAME ?? "player",
  keycloakPassword: process.env.E2E_KEYCLOAK_PASSWORD ?? "player123",
  initialBalanceCents: process.env.WALLET_INITIAL_BALANCE_CENTS ?? "100000",
  defaultTimeoutMs: Number(process.env.E2E_TIMEOUT_MS ?? "60000"),
  pollIntervalMs: Number(process.env.E2E_POLL_INTERVAL_MS ?? "200"),
};
