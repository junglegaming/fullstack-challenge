import { io } from 'socket.io-client'
import { useGameStore } from '../stores/game.store'
import { useWalletStore } from '../stores/wallet.store' // 💡 Importado
import { getWallet } from './wallet.service' // 💡 Importado o serviço de carteira existente
import keycloak from './keycloak'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const socket = io('http://127.0.0.1:4001', {
  autoConnect: false
})

socket.on('connect', () => {
  console.log('✅ SOCKET CONNECTED')
})

socket.on('betting_started', () => {
  useGameStore.getState().setStatus('betting')
  useGameStore.getState().setMultiplier(1)
  useGameStore.getState().setCrashed(false)
})

socket.on('multiplier_update', (data) => {
  useGameStore.getState().setStatus('running')
  useGameStore.getState().setMultiplier(Number(data.multiplier))
})

// 💡 Sincroniza estado de aposta E busca o saldo atualizado via API para todas as abas
socket.on('bet_placed', async (data) => {
  const currentUserId = keycloak.tokenParsed?.sub
  
  console.log('📌 [SOCKET DEBUG] Recebi bet_placed:', data)
  console.log('📌 [SOCKET DEBUG] Meu ID no Keycloak atual:', currentUserId)

  if (data.playerId === currentUserId) {
    console.log('✅ É o meu usuário! Atualizando aba secundária...')
    useGameStore.getState().setHasBet(true)

    try {

      await sleep(150)

      const wallet = await getWallet()
      console.log('💰 [SOCKET DEBUG] Novo saldo recebido da API:', wallet.balance)
      useWalletStore.getState().setBalance(Number(wallet.balance))
    } catch (err) {
      console.error('Erro ao sincronizar saldo via socket (bet_placed):', err)
    }
  } else {
    console.warn('⚠️ ID do jogador da aposta não bate com o meu ID logado.')
  }
})

socket.on('cashout_done', async (data) => {
  console.log('📌 [SOCKET DEBUG] Recebeu cashout_done:', data)
  
  const currentUserId = keycloak.tokenParsed?.sub
  console.log('📌 [SOCKET DEBUG] Meu User ID:', currentUserId)

  if (data.playerId === currentUserId) {
    console.log('✅ É o meu usuário! Atualizando aba secundária...')
    useGameStore.getState().setHasBet(false)

    try {

      await sleep(150)
      
      const wallet = await getWallet()
      console.log('💰 [SOCKET DEBUG] Novo saldo recebido da API:', wallet.balance)
      useWalletStore.getState().setBalance(Number(wallet.balance))
    } catch (err) {
      console.error('Erro ao sincronizar saldo via socket (cashout_done):', err)
    }
  } else {
    console.warn('❌ IDs não batem. ID do evento:', data.playerId, 'Meu ID:', currentUserId)
  }
})

socket.on('round_crashed', (data) => {
  useGameStore.getState().setStatus('crashed')
  useGameStore.getState().setCrashed(true)
  useGameStore.getState().setMultiplier(Number(data.crashPoint))
  
  // Reseta o botão para a próxima rodada
  useGameStore.getState().setHasBet(false) 
})

export { socket }