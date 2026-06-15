function readOptionalPositiveInteger(
  rawValue: string | undefined,
): number | undefined {
  if (!rawValue) {
    return undefined;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function readPositiveInteger(
  rawValue: string | undefined,
  fallback: number,
): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

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
    (typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "http://localhost:3000/auth/callback"),
  multiplierGrowthBpsPerSecond: readPositiveInteger(
    import.meta.env.VITE_MULTIPLIER_GROWTH_BPS_PER_SECOND,
    40,
  ),
  multiplierBoostAfterGainedBps:
    readOptionalPositiveInteger(
      import.meta.env.VITE_MULTIPLIER_BOOST_AFTER_GAINED_BPS,
    ) ?? 100,
  multiplierBoostGrowthBpsPerSecond:
    readOptionalPositiveInteger(
      import.meta.env.VITE_MULTIPLIER_BOOST_GROWTH_BPS_PER_SECOND,
    ) ?? 2000,
};