export const API_URL = import.meta.env.VITE_API_URL;

export const WS_URL = import.meta.env.VITE_WS_URL;

export const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
};

const missingKeycloakVars = Object.entries(keycloakConfig)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_KEYCLOAK_${key.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`);

if (missingKeycloakVars.length > 0) {
  throw new Error(
    `Configuração do Keycloak ausente no build: ${missingKeycloakVars.join(", ")}. ` +
      "Essas variáveis VITE_* são embutidas em tempo de build — confira os build args do Dockerfile/docker-compose.",
  );
}

export const gameRules = {
  minBet: 1,
  maxBet: 1000,
} as const;

export const config = {
  apiUrl: API_URL,
  wsUrl: WS_URL,
  keycloak: keycloakConfig,
};

export default config;
