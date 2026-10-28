import http from 'http';
import { app } from './app';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { TrackingSocketService } from './infrastructure/websocket/trackingSocket';

async function startServer() {
  try {
    await connectDatabase();

    const httpServer = http.createServer(app);
    
    // Initialize Real-time WebSocket Gateway for GPS live tracking
    TrackingSocketService.initialize(httpServer);

    const server = httpServer.listen(config.port, () => {
      console.log(`[Loadvanta Server] Running on http://localhost:${config.port}`);
      console.log(`[Loadvanta Server] API Documentation: http://localhost:${config.port}/api/docs`);
      console.log(`[Loadvanta Server] WebSocket GPS Streamer active on ws://localhost:${config.port}`);
    });

    const shutdown = async () => {
      console.log('\n[Loadvanta Server] Gracefully shutting down...');
      server.close(() => {
        console.log('[Loadvanta Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('[Loadvanta Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
