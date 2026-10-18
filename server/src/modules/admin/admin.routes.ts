import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorizeRoles } from '../../middleware/auth';
import { UserRole, VerificationStatus } from '@loadvanta/contracts';
import { User } from '../../infrastructure/database/models/User';
import { Vehicle } from '../../infrastructure/database/models/Vehicle';
import { Shipment } from '../../infrastructure/database/models/Shipment';
import { Booking } from '../../infrastructure/database/models/Booking';
import { PaymentRecord } from '../../infrastructure/database/models/PaymentRecord';
import { AuditLog } from '../../infrastructure/database/models/AuditLog';
import { ContactEnquiry } from '../../infrastructure/database/models/ContactEnquiry';
import { Types } from 'mongoose';

const router = Router();

// Protect all admin routes
router.use(authenticate, authorizeRoles(UserRole.ADMIN));

// Platform Metrics (from genuine MongoDB collections)
router.get('/metrics', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalUsers,
      totalShippers,
      totalTransporters,
      totalVehicles,
      totalShipments,
      totalBookings,
      pendingVerifications,
      paymentsSummary
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: UserRole.SHIPPER }),
      User.countDocuments({ role: UserRole.TRANSPORTER }),
      Vehicle.countDocuments(),
      Shipment.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments({ role: UserRole.TRANSPORTER, verificationStatus: VerificationStatus.PENDING }),
      PaymentRecord.aggregate([
        { $match: { status: 'CAPTURED' } },
        { $group: { _id: null, totalPaise: { $sum: '$amountPaise' } } }
      ])
    ]);

    const grossRevenueInr = paymentsSummary.length > 0 ? paymentsSummary[0].totalPaise / 100 : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalShippers,
        totalTransporters,
        totalVehicles,
        totalShipments,
        totalBookings,
        pendingVerifications,
        grossRevenueInr
      }
    });
  } catch (error) {
    next(error);
  }
});

// Users management
router.get('/users', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// Transporter verification queue
router.get('/verifications/transporters', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const transporters = await User.find({
      role: UserRole.TRANSPORTER
    }).select('-passwordHash').sort({ createdAt: -1 });

    res.json({ success: true, data: transporters });
  } catch (error) {
    next(error);
  }
});

// Review transporter verification
router.post('/verifications/transporters/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, notes } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          verificationStatus: status,
          verificationNotes: notes
        }
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      res.status(404).json({ success: false, error: { message: 'Transporter not found' } });
      return;
    }

    await AuditLog.create({
      actorId: new Types.ObjectId(req.user!.id),
      actorRole: req.user!.role,
      action: 'TRANSPORTER_VERIFICATION_REVIEW',
      targetEntity: 'User',
      targetId: req.params.id,
      metadata: { status, notes }
    });

    res.json({ success: true, data: user, message: `Transporter status updated to ${status}` });
  } catch (error) {
    next(error);
  }
});

// Vehicle verification queue
router.get('/verifications/vehicles', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicles = await Vehicle.find()
      .populate('transporterId', 'fullName companyName phone city')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
});

// Review vehicle verification
router.post('/verifications/vehicles/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { $set: { verificationStatus: status } },
      { new: true }
    );

    if (!vehicle) {
      res.status(404).json({ success: false, error: { message: 'Vehicle not found' } });
      return;
    }

    await AuditLog.create({
      actorId: new Types.ObjectId(req.user!.id),
      actorRole: req.user!.role,
      action: 'VEHICLE_VERIFICATION_REVIEW',
      targetEntity: 'Vehicle',
      targetId: req.params.id,
      metadata: { status }
    });

    res.json({ success: true, data: vehicle, message: `Vehicle verification status updated to ${status}` });
  } catch (error) {
    next(error);
  }
});

// Audit Logs
router.get('/audit-logs', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await AuditLog.find()
      .populate('actorId', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

// Contact enquiries
router.get('/enquiries', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enquiries = await ContactEnquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: enquiries });
  } catch (error) {
    next(error);
  }
});

export const adminRoutes = router;
