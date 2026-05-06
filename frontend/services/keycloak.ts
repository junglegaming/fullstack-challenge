const KEYCLOAK_URL =
  process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080";
const REALM = "crash-game";
const CLIENT_ID = "crash-game-client";

function getRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin + "/api/auth/callback";
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
  idToken?: string;
}

export class KeycloakService {
  private static VERIFIER_KEY = "pkce_verifier";

  /** Generate random string for PKCE verifier (43-128 chars) */
  private generateVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "")
      .slice(0, 64);
  }

  /** Create S256 code challenge from verifier */
  private async generateChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  /** Store verifier in sessionStorage (available across redirect) */
  private storeVerifier(verifier: string): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(KeycloakService.VERIFIER_KEY, verifier);
  }

  /** Store verifier in a cookie for server-side callback */
  private storeVerifierCookie(verifier: string): void {
    if (typeof window === "undefined") return;
    document.cookie = `pkce_verifier=${verifier}; path=/api/auth/callback; max-age=300; SameSite=Lax`;
  }

  /** Clear verifier cookie */
  private clearVerifierCookie(): void {
    if (typeof window === "undefined") return;
    document.cookie = `pkce_verifier=; path=/api/auth/callback; max-age=0`;
  }

  /** Retrieve verifier from sessionStorage */
  getVerifier(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(KeycloakService.VERIFIER_KEY);
  }

  /** Clear verifier */
  private clearVerifier(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(KeycloakService.VERIFIER_KEY);
  }

  /** Store tokens in localStorage */
  private storeTokens(tokens: TokenSet): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("kc_token", tokens.accessToken);
    localStorage.setItem("kc_refresh", tokens.refreshToken);
    localStorage.setItem("kc_expiry", tokens.expiresAt.toString());
    if (tokens.idToken) {
      localStorage.setItem("kc_id_token", tokens.idToken);
    }
  }

  /** Get access token */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("kc_token");
  }

  /** Get refresh token */
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("kc_refresh");
  }

  /** Get expiry timestamp */
  getExpiry(): number {
    if (typeof window === "undefined") return 0;
    const exp = localStorage.getItem("kc_expiry");
    return exp ? parseInt(exp, 10) : 0;
  }

  /** Check if currently authenticated with valid token */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const expiry = this.getExpiry();
    // Consider token expired 30 seconds early
    return Date.now() < expiry - 30_000;
  }

  /** Get username from ID token or JWT payload */
  getUsername(): string {
    const idToken = typeof window !== "undefined" ? localStorage.getItem("kc_id_token") : null;
    if (idToken) {
      try {
        const payload = JSON.parse(
          atob(idToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        return payload.preferred_username || payload.sub || "Player";
      } catch {
        // ignore
      }
    }
    // Fallback: parse access token
    const token = this.getToken();
    if (token) {
      try {
        const payload = JSON.parse(
          atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        return payload.preferred_username || payload.sub || "Player";
      } catch {
        // ignore
      }
    }
    return "Player";
  }

  /** Initiate login redirect */
  async login(): Promise<void> {
    if (typeof window === "undefined") return;

    const verifier = this.generateVerifier();
    this.storeVerifier(verifier);
    this.storeVerifierCookie(verifier);
    const challenge = await this.generateChallenge(verifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      scope: "openid profile email",
      redirect_uri: getRedirectUri(),
      code_challenge: challenge,
      code_challenge_method: "S256",
    });

    window.location.href = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth?${params}`;
  }

  /** Logout: clear tokens and redirect to Keycloak logout */
  logout(): void {
    if (typeof window === "undefined") return;
    const idToken = localStorage.getItem("kc_id_token");
    this.clearTokens();
    this.clearVerifier();
    this.clearVerifierCookie();
    if (idToken) {
      const logoutUrl =
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout?` +
        `id_token_hint=${encodeURIComponent(idToken)}&` +
        `post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
      window.location.href = logoutUrl;
    } else {
      window.location.href = "/";
    }
  }

  /** Clear all stored tokens */
  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("kc_token");
    localStorage.removeItem("kc_refresh");
    localStorage.removeItem("kc_expiry");
    localStorage.removeItem("kc_id_token");
  }

  /** Refresh access token using refresh token */
  async refreshAccessToken(): Promise<TokenSet | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: refreshToken,
      });

      const response = await fetch(
        `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params,
        },
      );

      if (!response.ok) {
        throw new Error("Refresh failed");
      }

      const data = await response.json();
      const tokens: TokenSet = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
        idToken: data.id_token,
      };
      this.storeTokens(tokens);
      return tokens;
    } catch (err) {
      console.error("Token refresh error:", err);
      this.clearTokens();
      return null;
    }
  }

  /** Get valid access token, refreshing if needed */
  async getValidToken(): Promise<string | null> {
    if (this.isAuthenticated()) {
      return this.getToken();
    }
    // Try refresh
    const newTokens = await this.refreshAccessToken();
    return newTokens?.accessToken || null;
  }

  /** Auto-refresh timer */
  private autoRefreshTimer: ReturnType<typeof setInterval> | null = null;

  startAutoRefresh(): void {
    if (this.autoRefreshTimer) return;
    this.autoRefreshTimer = setInterval(() => {
      if (!this.isAuthenticated()) {
        this.refreshAccessToken();
      }
    }, 60_000); // check every minute
  }

  stopAutoRefresh(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }
}

export default new KeycloakService();
