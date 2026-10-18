import { Router } from 'express';
import { quotationController } from './quotation.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@loadvanta/contracts';

const router = Router();

// Transporter submits a quotation
router.post('/', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  quotationController.submit(req, res, next);
});

// Transporter's own quotations
router.get('/my-quotations', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  quotationController.getMyQuotations(req, res, next);
});

// Quotations for a specific shipment (Shipper or Admin)
router.get('/shipment/:shipmentId', authenticate, (req, res, next) => {
  quotationController.getForShipment(req, res, next);
});

// Withdraw quotation (Transporter)
router.post('/:id/withdraw', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  quotationController.withdraw(req, res, next);
});

// Reject quotation (Shipper)
router.post('/:id/reject', authenticate, authorizeRoles(UserRole.SHIPPER, UserRole.ADMIN), (req, res, next) => {
  quotationController.reject(req, res, next);
});

export const quotationRoutes = router;
