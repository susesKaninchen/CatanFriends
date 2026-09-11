import { io, Socket } from 'socket.io-client';

// Connect to backend server
const SERVER_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/';

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});
