import { E2E_CONFIG } from "./config";

type TokenResponse = {
  access_token: string;
};

export async function getAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: E2E_CONFIG.keycloakClientId,
    username: E2E_CONFIG.keycloakUsername,
    password: E2E_CONFIG.keycloakPassword,
  });

  const response = await fetch(E2E_CONFIG.keycloakTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to obtain Keycloak token (${response.status}): ${text}`);
  }

  const payload = (await response.json()) as TokenResponse;

  if (!payload.access_token) {
    throw new Error("Keycloak token response did not include access_token");
  }

  return payload.access_token;
}
