import { Router, Request, Response, NextFunction } from 'express';
import { returnLoadMatchingEngine } from './matching.service';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Get smart return load matches for a specific vehicle
router.get('/vehicle/:vehicleId', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { homeCity, targetDate } = req.query;
    const matches = await returnLoadMatchingEngine.findMatchesForVehicle(
      req.params.vehicleId,
      homeCity as string,
      targetDate ? new Date(targetDate as string) : undefined
    );

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    next(error);
  }
});

export const matchingRoutes = router;
