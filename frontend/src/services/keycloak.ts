interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
}

const CONFIG: KeycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'crash-game',
  clientId: 'crash-game-client',
};

class KeycloakService {
  login(): void {
    const redirectUri = window.location.origin + '/game';
    const codeChallenge = crypto.randomUUID().replace(/-/g, '');
    const authUrl = `${CONFIG.url}/realms/${CONFIG.realm}/protocol/openid-connect/auth?` +
      `client_id=${CONFIG.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid&` +
      `code_challenge_method=S256&` +
      `code_challenge=${btoa(codeChallenge).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;

    window.location.href = authUrl;
  }

  getToken(): string | null {
    return localStorage.getItem('kc_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_refresh');
    localStorage.removeItem('kc_expiry');
  }
}

export default new KeycloakService();
