import keycloak from './keycloak'

const API_URL = 'http://localhost:8000'

export async function placeBet(amount: number) {
  const response = await fetch(`${API_URL}/games/bet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${keycloak.token}`,
    },
    body: JSON.stringify({
      amount,
    }),
  })

  if (!response.ok) {
    throw new Error('Erro ao apostar')
  }

  return response.json()
}

export async function cashout() {
  const response = await fetch(`${API_URL}/games/bet/cashout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keycloak.token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Erro ao sacar')
  }

  return response.json()
}