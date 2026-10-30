import { io } from 'socket.io-client';
import { USE_MOCK } from '../api/axios.js';
import { createMockSocket } from '../mocks/mockSocket.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

/**
 * Connects after login. The httpOnly auth cookie is sent automatically (withCredentials).
 * In mock mode a local event emitter simulates the server.
 */
export function connectSocket() {
  if (socket) return socket;
  socket = USE_MOCK
    ? createMockSocket()
    : io(SOCKET_URL, { withCredentials: true, autoConnect: false, transports: ['websocket', 'polling'] });
  socket.connect();
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
