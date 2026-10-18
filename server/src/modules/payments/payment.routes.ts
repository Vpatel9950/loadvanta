import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Gateway status check (returns whether live gateway is configured or test simulated)
router.get('/status', (req, res) => {
  paymentController.getStatus(req, res);
});

// Create payment order for booking
router.post('/orders', authenticate, (req, res, next) => {
  paymentController.createOrder(req, res, next);
});

// Verify payment
router.post('/verify', authenticate, (req, res, next) => {
  paymentController.verify(req, res, next);
});

// Razorpay Webhook listener
router.post('/webhooks/razorpay', (req, res, next) => {
  paymentController.webhook(req, res, next);
});

export const paymentRoutes = router;
