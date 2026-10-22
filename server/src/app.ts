import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { swaggerSpec } from './docs/swagger';

// Routes
import { authRoutes } from './modules/auth/auth.routes';
import { shipmentRoutes } from './modules/shipments/shipment.routes';
import { vehicleRoutes } from './modules/vehicles/vehicle.routes';
import { quotationRoutes } from './modules/quotations/quotation.routes';
import { bookingRoutes } from './modules/bookings/booking.routes';
import { matchingRoutes } from './modules/matching/matching.routes';
import { paymentRoutes } from './modules/payments/payment.routes';
import { contactRoutes } from './modules/contact/contact.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { adminRoutes } from './modules/admin/admin.routes';

export const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false // allow swagger and dev react client
  })
);

// Flexible CORS configuration supporting Vercel and local development
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === config.clientUrl ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-razorpay-signature']
  })
);

// Cookie Parser
app.use(cookieParser(config.jwt.cookieSecret));

// Capture raw body for webhook verification before json parsing
app.use(
  express.json({
    limit: '5mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Logging
if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter
app.use('/api/', apiRateLimiter);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Welcome Route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Loadvanta Logistics Marketplace API is running smoothly 🚀',
    docs: '/api/docs',
    health: '/health'
  });
});

// Health Checks
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    environment: config.env,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Versioned API v1 Router
const v1 = express.Router();
v1.use('/auth', authRoutes);
v1.use('/shipments', shipmentRoutes);
v1.use('/vehicles', vehicleRoutes);
v1.use('/quotations', quotationRoutes);
v1.use('/bookings', bookingRoutes);
v1.use('/matches', matchingRoutes);
v1.use('/payments', paymentRoutes);
v1.use('/contact', contactRoutes);
v1.use('/notifications', notificationRoutes);
v1.use('/admin', adminRoutes);

app.use('/api/v1', v1);

// Centralized error handling
app.use(errorHandler);
