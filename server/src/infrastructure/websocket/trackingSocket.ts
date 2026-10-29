import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Booking } from '../database/models/Booking';
import { Vehicle } from '../database/models/Vehicle';
import { config } from '../../config/env';

export interface LocationPayload {
  bookingId: string;
  vehicleId?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number; // km/h
  accuracy?: number; // meters
  timestamp?: string | number | Date;
  checkpointNote?: string;
  isLive?: boolean;
  status?: 'LIVE' | 'OFFLINE' | 'UNAVAILABLE';
}

interface ActiveTripState {
  bookingId: string;
  transporterId: string;
  socketId: string;
  isLive: boolean;
  lastUpdated: number;
  lastLocation: LocationPayload;
}

// In-memory registry of active live tracking sessions
const activeTripsMap = new Map<string, ActiveTripState>();
// Throttle DB writes (e.g., at most once every 3 seconds per booking)
const lastDbWriteTime = new Map<string, number>();

export class TrackingSocketService {
  private static io: SocketIOServer | null = null;

  public static initialize(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          callback(null, true);
        },
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 30000,
      pingInterval: 10000
    });

    this.io = io;

    // Authentication middleware for Socket.IO
    io.use((socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (token) {
          const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
          socket.data.user = decoded;
        }
        next();
      } catch (err: any) {
        // Socket connection is permitted, but individual protected operations verify socket.data.user
        next();
      }
    });

    // Stale GPS watchdog: runs every 5 seconds to mark sessions offline if no fresh GPS received in 15 seconds
    setInterval(() => {
      const now = Date.now();
      activeTripsMap.forEach((state, bookingId) => {
        if (state.isLive && now - state.lastUpdated > 15000) {
          state.isLive = false;
          io.to(`trip:${bookingId}`).emit('trip:tracking_status', {
            bookingId,
            isLive: false,
            status: 'OFFLINE',
            message: 'No recent GPS pings received. Transporter is currently offline.'
          });
          io.to('admin:fleet_radar').emit('fleet:tracking_status', {
            bookingId,
            isLive: false,
            status: 'OFFLINE'
          });
        }
      });
    }, 5000);

    io.on('connection', (socket: Socket) => {
      // 1. Client (Shipper or Transporter) joins a specific trip tracking room
      socket.on('join_trip', async (data: string | { bookingId: string }) => {
        const bookingId = typeof data === 'string' ? data : data?.bookingId;
        if (!bookingId) return;

        const user = socket.data.user;
        if (!user) {
          socket.emit('trip:error', {
            bookingId,
            code: 'AUTH_REQUIRED',
            message: 'Authentication required. Please log in to track this shipment.'
          });
          return;
        }

        try {
          const booking = await Booking.findById(bookingId).select(
            'shipperId transporterId vehicleId status liveTracking'
          );

          if (!booking) {
            socket.emit('trip:error', {
              bookingId,
              code: 'NOT_FOUND',
              message: 'Shipment booking not found.'
            });
            return;
          }

          // Strict Authorization: Only the assigned Shipper, assigned Transporter, or Admin can track
          const isAssignedShipper = booking.shipperId.toString() === user.id;
          const isAssignedTransporter = booking.transporterId.toString() === user.id;
          const isAdmin = user.role === 'ADMIN';

          if (!isAssignedShipper && !isAssignedTransporter && !isAdmin) {
            socket.emit('trip:error', {
              bookingId,
              code: 'UNAUTHORIZED',
              message: 'Access Denied: Only the assigned shipper or transporter can track this shipment.'
            });
            return;
          }

          const room = `trip:${bookingId}`;
          socket.join(room);

          // Check if an active live stream exists right now
          const activeState = activeTripsMap.get(bookingId);
          const isFresh = activeState && activeState.isLive && Date.now() - activeState.lastUpdated < 15000;

          if (isFresh && activeState?.lastLocation) {
            socket.emit('trip:location_update', {
              ...activeState.lastLocation,
              isLive: true,
              status: 'LIVE'
            });
          } else if (booking.liveTracking?.lastKnownLocation?.latitude) {
            // Send genuine last recorded position from DB, but marked explicitly as OFFLINE
            socket.emit('trip:location_update', {
              bookingId,
              vehicleId: booking.vehicleId?.toString(),
              latitude: booking.liveTracking.lastKnownLocation.latitude,
              longitude: booking.liveTracking.lastKnownLocation.longitude,
              heading: booking.liveTracking.lastKnownLocation.heading || 0,
              speed: 0,
              accuracy: booking.liveTracking.lastKnownLocation.accuracy,
              timestamp: booking.liveTracking.lastKnownLocation.timestamp,
              isLive: false,
              status: 'OFFLINE'
            });
          } else {
            // No location has ever been transmitted yet
            socket.emit('trip:tracking_status', {
              bookingId,
              isLive: false,
              status: 'UNAVAILABLE',
              message: 'Transporter has not started GPS broadcast yet.'
            });
          }
        } catch (err: any) {
          socket.emit('trip:error', { bookingId, message: err.message });
        }
      });

      socket.on('leave_trip', (data: string | { bookingId: string }) => {
        const bookingId = typeof data === 'string' ? data : data?.bookingId;
        if (bookingId) {
          socket.leave(`trip:${bookingId}`);
        }
      });

      // 2. Admin joins the master fleet radar room
      socket.on('join_admin_radar', async () => {
        const user = socket.data.user;
        if (!user || user.role !== 'ADMIN') {
          socket.emit('admin:error', { message: 'Unauthorized: Admin privileges required.' });
          return;
        }

        socket.join('admin:fleet_radar');

        // Send all currently active verified locations
        const activeList: LocationPayload[] = [];
        activeTripsMap.forEach((state) => {
          if (state.lastLocation) {
            activeList.push({
              ...state.lastLocation,
              isLive: state.isLive && Date.now() - state.lastUpdated < 15000,
              status: state.isLive && Date.now() - state.lastUpdated < 15000 ? 'LIVE' : 'OFFLINE'
            });
          }
        });
        socket.emit('fleet:all_active_locations', activeList);
      });

      // 3. Transporter Device GPS Update Broadcast
      socket.on('driver:location_update', async (payload: LocationPayload) => {
        const { bookingId, latitude, longitude, heading = 0, speed = 0, accuracy = 0 } = payload;
        if (!bookingId || typeof latitude !== 'number' || typeof longitude !== 'number') {
          return;
        }

        const user = socket.data.user;
        if (!user) {
          socket.emit('driver:error', {
            message: 'Authentication required to broadcast location.'
          });
          return;
        }

        try {
          const booking = await Booking.findById(bookingId).select('transporterId vehicleId');
          if (!booking) return;

          // Only the assigned transporter or admin can broadcast GPS for this booking
          const isAssignedTransporter = booking.transporterId.toString() === user.id;
          const isAdmin = user.role === 'ADMIN';

          if (!isAssignedTransporter && !isAdmin) {
            socket.emit('driver:error', {
              message: 'Unauthorized: Only the assigned transporter can broadcast GPS for this trip.'
            });
            return;
          }

          const now = Date.now();
          const locationData: LocationPayload = {
            bookingId,
            vehicleId: booking.vehicleId?.toString() || payload.vehicleId,
            latitude,
            longitude,
            heading: Math.round(heading),
            speed: Math.max(0, Math.round(speed)),
            accuracy: Math.round(accuracy),
            timestamp: payload.timestamp || now,
            isLive: true,
            status: 'LIVE'
          };

          // Store in active session map
          activeTripsMap.set(bookingId, {
            bookingId,
            transporterId: user.id,
            socketId: socket.id,
            isLive: true,
            lastUpdated: now,
            lastLocation: locationData
          });

          // Broadcast real GPS coordinates to authorized rooms
          io.to(`trip:${bookingId}`).emit('trip:location_update', locationData);
          io.to('admin:fleet_radar').emit('fleet:location_update', locationData);

          // Throttled persistence to MongoDB Atlas (at most once every 3 seconds per trip)
          const lastWrite = lastDbWriteTime.get(bookingId) || 0;
          if (now - lastWrite > 3000) {
            lastDbWriteTime.set(bookingId, now);

            const locObj = {
              latitude,
              longitude,
              heading: Math.round(heading),
              speed: Math.max(0, Math.round(speed)),
              accuracy: Math.round(accuracy),
              timestamp: new Date()
            };

            await Booking.findByIdAndUpdate(bookingId, {
              $set: {
                'liveTracking.lastKnownLocation': locObj,
                'liveTracking.isActive': true
              },
              $push: {
                'liveTracking.history': {
                  $each: [{ latitude, longitude, timestamp: new Date(), speed: locObj.speed, heading: locObj.heading }],
                  $slice: -200
                }
              }
            });

            if (booking.vehicleId) {
              await Vehicle.findByIdAndUpdate(booking.vehicleId, {
                $set: {
                  lastKnownLocation: {
                    ...locObj,
                    updatedAt: new Date()
                  }
                }
              });
            }
          }
        } catch (err: any) {
          console.error('[TrackingSocket] Failed to process GPS update:', err.message);
        }
      });

      // 4. Transporter explicitly toggles tracking (e.g. Stop Tracking button)
      socket.on(
        'driver:toggle_tracking',
        async ({ bookingId, isActive }: { bookingId: string; isActive: boolean }) => {
          if (!bookingId) return;

          const session = activeTripsMap.get(bookingId);
          if (session) {
            session.isLive = isActive;
          }

          io.to(`trip:${bookingId}`).emit('trip:tracking_status', {
            bookingId,
            isLive: isActive,
            status: isActive ? 'LIVE' : 'OFFLINE',
            message: isActive ? 'Transporter has started live GPS' : 'Transporter stopped GPS tracking.'
          });

          io.to('admin:fleet_radar').emit('fleet:tracking_status', {
            bookingId,
            isLive: isActive,
            status: isActive ? 'LIVE' : 'OFFLINE'
          });

          try {
            await Booking.findByIdAndUpdate(bookingId, {
              $set: { 'liveTracking.isActive': isActive }
            });
          } catch {
            // ignore
          }
        }
      );

      // 5. Handle disconnection: if broadcasting transporter disconnects, notify listeners
      socket.on('disconnect', () => {
        activeTripsMap.forEach((session, bookingId) => {
          if (session.socketId === socket.id && session.isLive) {
            session.isLive = false;
            io.to(`trip:${bookingId}`).emit('trip:tracking_status', {
              bookingId,
              isLive: false,
              status: 'OFFLINE',
              message: 'Transporter connection dropped. GPS is currently OFFLINE.'
            });
            io.to('admin:fleet_radar').emit('fleet:tracking_status', {
              bookingId,
              isLive: false,
              status: 'OFFLINE'
            });

            Booking.findByIdAndUpdate(bookingId, {
              $set: { 'liveTracking.isActive': false }
            }).catch(() => {});
          }
        });
      });
    });

    console.log('[TrackingSocket] Authenticated Real-Time GPS Gateway Initialized.');
    return io;
  }

  public static getIO(): SocketIOServer | null {
    return this.io;
  }
}
