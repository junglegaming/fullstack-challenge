import { io } from 'socket.io-client'
import { useGameStore } from '../stores/game.store'

const socket = io('http://127.0.0.1:4001')

socket.on('connect', () => {
  console.log('✅ SOCKET CONNECTED')
})

socket.on('multiplier_update', (data) => {
  useGameStore
    .getState()
    .setMultiplier(Number(data.multiplier))

  useGameStore
    .getState()
    .setCrashed(false)
})

socket.on('round_crashed', (data) => {
  useGameStore
    .getState()
    .setMultiplier(Number(data.crashPoint))

  useGameStore
    .getState()
    .setCrashed(true)
})

export { socket }