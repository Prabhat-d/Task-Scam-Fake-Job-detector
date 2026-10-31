import { io } from 'socket.io-client';
import { USE_MOCK } from '../api/axios.js';
import { createMockSocket } from '../mocks/mockSocket.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/**
 * Connects to the real backend socket or simulated mock socket.
 * The httpOnly auth cookie is sent automatically (withCredentials).
 */
export function connectSocket() {
  if (socket) {
    if (!socket.connected && !USE_MOCK) socket.connect();
    return socket;
  }
  socket = USE_MOCK
    ? createMockSocket()
    : io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });
  return socket;
}

export function getSocket() {
  if (!socket) {
    return connectSocket();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
