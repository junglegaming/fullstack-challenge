import type { AuthProviderProps } from 'react-oidc-context'
import { WebStorageStateStore } from 'oidc-client-ts'

const KEYCLOAK_BASE = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080'
const REALM = import.meta.env.VITE_KEYCLOAK_REALM ?? 'crash-game'
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'crash-game-client'

export const oidcConfig: AuthProviderProps = {
  authority: `${KEYCLOAK_BASE}/realms/${REALM}`,
  client_id: CLIENT_ID,
  redirect_uri: window.location.origin + '/callback',
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  // Silently renew token before expiry — without this the session dies after ~5min
  automaticSilentRenew: true,
  // Persist session across page reloads
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  // Remove OIDC params from URL and go to root after login
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, '/')
  },
}
