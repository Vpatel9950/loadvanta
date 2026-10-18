import { Request, Response, NextFunction } from 'express';
import { shipmentService } from './shipment.service';

export class ShipmentController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        pickupCity,
        deliveryCity,
        cargoType,
        requiredVehicleType,
        status,
        shipperId,
        page,
        limit
      } = req.query;

      const result = await shipmentService.getShipments({
        pickupCity: pickupCity as string,
        deliveryCity: deliveryCity as string,
        cargoType: cargoType as any,
        requiredVehicleType: requiredVehicleType as any,
        status: status as any,
        shipperId: shipperId as string,
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

  async getMyShipments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }

      const result = await shipmentService.getShipments({
        shipperId: req.user.id,
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
      const shipment = await shipmentService.getShipmentById(req.params.id);
      if (!shipment) {
        res.status(404).json({ success: false, error: { message: 'Shipment not found' } });
        return;
      }
      res.json({ success: true, data: shipment });
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
      const shipment = await shipmentService.createShipment(req.user.id, req.body);
      res.status(201).json({ success: true, data: shipment });
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
      const shipment = await shipmentService.updateShipment(req.params.id, req.user.id, req.body);
      res.json({ success: true, data: shipment });
    } catch (error) {
      next(error);
    }
  }

  async publish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const shipment = await shipmentService.publishShipment(req.params.id, req.user.id);
      res.json({ success: true, data: shipment, message: 'Shipment published successfully' });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const shipment = await shipmentService.cancelShipment(req.params.id, req.user.id);
      res.json({ success: true, data: shipment, message: 'Shipment cancelled' });
    } catch (error) {
      next(error);
    }
  }
}

export const shipmentController = new ShipmentController();
