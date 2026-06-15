import { config } from "../config";

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: number;
};

const TOKENS_KEY = "crash.auth.tokens";
const VERIFIER_KEY = "crash.auth.pkceVerifier";

export function getStoredTokens(): AuthTokens | null {
  const raw = window.localStorage.getItem(TOKENS_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    clearTokens();
    return null;
  }
}

export function storeTokens(tokens: AuthTokens): void {
  window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  window.localStorage.removeItem(TOKENS_KEY);
}

export function getAccessToken(): string | null {
  const tokens = getStoredTokens();

  if (!tokens || tokens.expiresAt <= Date.now()) {
    return null;
  }

  return tokens.accessToken;
}

export function getPlayerId(): string | null {
  const token = getStoredTokens()?.accessToken;

  if (!token) {
    return null;
  }

  return decodeJwtPayload(token).sub ?? null;
}

export function isCurrentPlayer(playerId: string | undefined): boolean {
  if (!playerId) {
    return false;
  }

  const currentPlayerId = getPlayerId();
  return Boolean(currentPlayerId && currentPlayerId === playerId);
}

export function getUsername(): string {
  const token = getStoredTokens()?.accessToken;

  if (!token) {
    return "player";
  }

  const payload = decodeJwtPayload(token);
  return (
    payload.preferred_username ??
    payload.name ??
    payload.sub ??
    "player"
  );
}

export async function redirectToLogin(): Promise<void> {
  const codeVerifier = createRandomString(64);
  const codeChallenge = await createCodeChallenge(codeVerifier);
  window.sessionStorage.setItem(VERIFIER_KEY, codeVerifier);

  const params = new URLSearchParams({
    client_id: config.keycloakClientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid profile",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  window.location.assign(
    `${config.keycloakIssuer}/protocol/openid-connect/auth?${params.toString()}`,
  );
}

export async function exchangeCodeForTokens(code: string): Promise<AuthTokens> {
  const codeVerifier = window.sessionStorage.getItem(VERIFIER_KEY);

  if (!codeVerifier) {
    throw new Error("Missing PKCE verifier");
  }

  const response = await fetch(
    `${config.keycloakIssuer}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.keycloakClientId,
        redirect_uri: config.redirectUri,
        code,
        code_verifier: codeVerifier,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to exchange Keycloak authorization code");
  }

  const body = await response.json() as {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
  };

  const tokens: AuthTokens = {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    idToken: body.id_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };

  storeTokens(tokens);
  window.sessionStorage.removeItem(VERIFIER_KEY);

  return tokens;
}

export function logout(): void {
  clearTokens();
  window.location.assign("/login");
}

function decodeJwtPayload(token: string): Record<string, string | undefined> {
  const [, payload] = token.split(".");

  if (!payload) {
    return {};
  }

  try {
    return JSON.parse(atob(toBase64(payload))) as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

function toBase64(value: string): string {
  return value.replace(/-/g, "+").replace(/_/g, "/");
}

function createRandomString(length: number): string {
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~".charAt(
      value % 66,
    ),
  ).join("");
}

async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(digest));
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
