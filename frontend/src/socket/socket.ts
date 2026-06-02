import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:8000'

let socket: Socket | null = null
let currentToken = ''

export function getSocket(token: string): Socket {
  // Reconnect with new token if it changed (e.g. silent renew updated the access token)
  if (socket?.connected && token === currentToken) return socket

  socket?.disconnect()
  currentToken = token

  socket = io(SOCKET_URL, {
    path: '/games/socket.io',
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  })

  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
  currentToken = ''
}
