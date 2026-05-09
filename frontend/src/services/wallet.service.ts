import { api } from './api'

export async function createWallet() {
  const response = await api('http://localhost:4002/wallets', {
    method: 'POST',
  })

  // Se o backend responder com erro (ex: 500 porque a carteira já existe)
  if (!response.ok) {
    throw new Error(`Erro ao criar carteira: Status ${response.status}`)
  }

  return response.json()
}

export async function getWallet() {
  const response = await api('http://127.0.0.1:4002/wallets/me')

  if (!response.ok) {
    throw new Error(`Erro ao buscar carteira: Status ${response.status}`)
  }

  return response.json()
}