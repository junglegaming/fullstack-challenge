export const E2E_CONFIG = {
  apiBaseUrl: process.env.E2E_API_BASE_URL ?? "http://localhost:8000",
  gamesBaseUrl: process.env.E2E_GAMES_BASE_URL ?? "http://localhost:4001",
  websocketUrl: process.env.E2E_WS_URL ?? "http://localhost:4001/games",
  keycloakTokenUrl:
    process.env.E2E_KEYCLOAK_TOKEN_URL ??
    "http://localhost:8080/realms/crash-game/protocol/openid-connect/token",
  keycloakClientId: process.env.E2E_KEYCLOAK_CLIENT_ID ?? "crash-game-client",
  keycloakUsername: process.env.E2E_KEYCLOAK_USERNAME ?? "player",
  keycloakPassword: process.env.E2E_KEYCLOAK_PASSWORD ?? "player123",
  testPlayerId: "00000000-0000-4000-8000-000000000001",
  defaultTimeoutMs: Number(process.env.E2E_TIMEOUT_MS ?? "60000"),
  pollIntervalMs: Number(process.env.E2E_POLL_INTERVAL_MS ?? "200"),
};
