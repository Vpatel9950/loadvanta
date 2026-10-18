import { Router } from 'express';
import { vehicleController } from './vehicle.controller';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole } from '@loadvanta/contracts';

const router = Router();

// Public vehicle search & directory
router.get('/', (req, res, next) => {
  vehicleController.list(req, res, next);
});

// Transporter's own fleet
router.get('/my-fleet', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  vehicleController.getMyVehicles(req, res, next);
});

router.get('/:id', (req, res, next) => {
  vehicleController.getById(req, res, next);
});

// Transporter actions
router.post('/', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  vehicleController.create(req, res, next);
});

router.patch('/:id', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  vehicleController.update(req, res, next);
});

router.post('/:id/deactivate', authenticate, authorizeRoles(UserRole.TRANSPORTER, UserRole.ADMIN), (req, res, next) => {
  vehicleController.deactivate(req, res, next);
});

export const vehicleRoutes = router;
