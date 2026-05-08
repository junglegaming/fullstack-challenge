import { api } from './api'

export async function createWallet() {
  const response = await api(
    'http://localhost:4002/wallets',
    {
      method: 'POST',
    },
  )

  return response.json()
}

export async function getWallet() {
  const response = await api(
    'http://127.0.0.1:4002/wallets/me',
  )

  return response.json()
}