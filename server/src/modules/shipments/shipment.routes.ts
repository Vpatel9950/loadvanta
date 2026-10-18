import { Router } from 'express';
import { shipmentController } from './shipment.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@loadvanta/contracts';

const router = Router();

// Public load discovery & search
router.get('/', (req, res, next) => {
  shipmentController.list(req, res, next);
});

// Shipper's own shipments
router.get('/my-shipments', authenticate, authorizeRoles(UserRole.SHIPPER, UserRole.ADMIN), (req, res, next) => {
  shipmentController.getMyShipments(req, res, next);
});

router.get('/:id', (req, res, next) => {
  shipmentController.getById(req, res, next);
});

// Shipper actions
router.post('/', authenticate, authorizeRoles(UserRole.SHIPPER, UserRole.ADMIN), (req, res, next) => {
  shipmentController.create(req, res, next);
});

router.patch('/:id', authenticate, authorizeRoles(UserRole.SHIPPER, UserRole.ADMIN), (req, res, next) => {
  shipmentController.update(req, res, next);
});

router.post('/:id/publish', authenticate, authorizeRoles(UserRole.SHIPPER, UserRole.ADMIN), (req, res, next) => {
  shipmentController.publish(req, res, next);
});

router.post('/:id/cancel', authenticate, authorizeRoles(UserRole.SHIPPER, UserRole.ADMIN), (req, res, next) => {
  shipmentController.cancel(req, res, next);
});

export const shipmentRoutes = router;
