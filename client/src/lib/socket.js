import { io } from 'socket.io-client'

// Empty = same origin as the page (works through the Vite proxy in dev, also on phones).
// Set VITE_SOCKET_URL only when the API is hosted on a different domain (production).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined

let socket = null

/**
 * Initialize and connect the socket with an auth token.
 * Calling connect() again while already connected is a no-op.
 */
export function connectSocket(token) {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  return socket
}

/**
 * Disconnect and destroy the socket.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Returns the current socket instance (may be null if not connected).
 */
export function getSocket() {
  return socket
}
