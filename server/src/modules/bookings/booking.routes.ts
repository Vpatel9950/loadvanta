import { Router } from 'express';
import { bookingController } from './booking.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@loadvanta/contracts';

const router = Router();

// Confirm a booking from an accepted quotation (Shipper)
router.post('/', authenticate, authorizeRoles(UserRole.SHIPPER, UserRole.ADMIN), (req, res, next) => {
  bookingController.confirm(req, res, next);
});

// View user's bookings (Shipper / Transporter / Admin)
router.get('/', authenticate, (req, res, next) => {
  bookingController.getMyBookings(req, res, next);
});

router.get('/:id', authenticate, (req, res, next) => {
  bookingController.getById(req, res, next);
});

// Transporter updates trip milestone
router.post('/:id/milestones', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  bookingController.addMilestone(req, res, next);
});

// Transporter uploads Proof of Delivery (POD)
router.post('/:id/delivery-proof', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  bookingController.uploadDeliveryProof(req, res, next);
});

export const bookingRoutes = router;
