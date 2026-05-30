import type { AuthProviderProps } from 'react-oidc-context'

const KEYCLOAK_BASE = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080'
const REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? 'crash-game'
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'crash-game-client'

export const oidcConfig: AuthProviderProps = {
  authority: `${KEYCLOAK_BASE}/realms/${REALM}`,
  client_id: CLIENT_ID,
  redirect_uri: window.location.origin + '/callback',
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  // PKCE S256 is the default in oidc-client-ts
  onSigninCallback: () => {
    // Remove the auth params from the URL without a full reload
    window.history.replaceState({}, document.title, window.location.pathname)
  },
}
