import keycloak from './keycloak'

export async function api(
  url: string,
  options: RequestInit = {},
) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${keycloak.token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
}