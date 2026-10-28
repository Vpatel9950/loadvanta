import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).origin
      : 'http://localhost:5000';

    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: (cb) => {
        // Send current JWT token from localStorage for authentication
        const token = localStorage.getItem('loadvanta_token');
        cb({ token });
      },
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected to Loadvanta Real-Time GPS Hub:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('[WebSocket] Connection Error:', error.message);
    });
  }

  return socket;
};
