import { Request, Response, NextFunction } from 'express';
import { vehicleService } from './vehicle.service';

export class VehicleController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        city,
        vehicleType,
        minCapacity,
        maxCapacity,
        cargoType,
        isAvailable,
        transporterId,
        page,
        limit
      } = req.query;

      const result = await vehicleService.getVehicles({
        city: city as string,
        vehicleType: vehicleType as any,
        minCapacity: minCapacity ? parseFloat(minCapacity as string) : undefined,
        maxCapacity: maxCapacity ? parseFloat(maxCapacity as string) : undefined,
        cargoType: cargoType as any,
        isAvailable: isAvailable !== undefined ? isAvailable === 'true' : undefined,
        transporterId: transporterId as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 12
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyVehicles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const result = await vehicleService.getVehicles({
        transporterId: req.user.id,
        page: 1,
        limit: 100
      });

      res.json({
        success: true,
        data: result.items
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vehicle = await vehicleService.getVehicleById(req.params.id);
      if (!vehicle) {
        res.status(404).json({ success: false, error: { message: 'Vehicle not found' } });
        return;
      }
      res.json({ success: true, data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const vehicle = await vehicleService.createVehicle(req.user.id, req.body);
      res.status(201).json({ success: true, data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const vehicle = await vehicleService.updateVehicle(req.params.id, req.user.id, req.body);
      res.json({ success: true, data: vehicle });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const vehicle = await vehicleService.deactivateVehicle(req.params.id, req.user.id);
      res.json({ success: true, data: vehicle, message: 'Vehicle deactivated' });
    } catch (error) {
      next(error);
    }
  }
}

export const vehicleController = new VehicleController();
