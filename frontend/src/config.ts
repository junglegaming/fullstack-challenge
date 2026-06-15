export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  websocketUrl: import.meta.env.VITE_WS_URL ?? "http://localhost:4001/games",
  keycloakIssuer:
    import.meta.env.VITE_KEYCLOAK_ISSUER ??
    "http://localhost:8080/realms/crash-game",
  keycloakClientId:
    import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "crash-game-client",
  redirectUri:
    import.meta.env.VITE_KEYCLOAK_REDIRECT_URI ??
    `${window.location.origin}/auth/callback`,
};
