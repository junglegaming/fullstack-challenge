const KEYCLOAK_CONFIG = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
  realm: "crash-game",
  clientId: "crash-game-client",
};

export class KeycloakService {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("kc_token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  login() {
    const redirectUri =
      typeof window !== "undefined"
        ? window.location.origin + "/game"
        : "http://localhost:3000/game";

    const codeChallenge = this.generateCodeChallenge();

    const authUrl =
      `${KEYCLOAK_CONFIG.url}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?` +
      `client_id=${KEYCLOAK_CONFIG.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid&` +
      `code_challenge_method=S256&` +
      `code_challenge=${codeChallenge}`;

    if (typeof window !== "undefined") {
      window.location.href = authUrl;
    }
  }

  logout() {
    localStorage.removeItem("kc_token");
    localStorage.removeItem("kc_refresh");
    localStorage.removeItem("kc_expiry");
  }

  private generateCodeChallenge(): string {
    const challenge = crypto.randomUUID().replace(/-/g, "");
    return btoa(challenge)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
}

export default new KeycloakService();
