import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const rawUrl =
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://localhost:5000';

    let serverUrl: string;
    try {
      serverUrl = new URL(rawUrl).origin;
    } catch {
      serverUrl = rawUrl.replace(/\/api\/v1\/?$/, '');
    }

    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: (cb) => {
        // Send current JWT token from localStorage for authentication
        const token = localStorage.getItem('loadvanta_token');
        cb({ token });
      },
      reconnection: true,
      reconnectionAttempts: 25,
      reconnectionDelay: 1500
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
