import { Request, Response, NextFunction } from 'express';
import { bookingService } from './booking.service';

export class BookingController {
  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const booking = await bookingService.confirmBooking(req.body.quotationId, req.user.id);
      res.status(201).json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const bookings = await bookingService.getMyBookings(req.user.id, req.user.role);
      res.json({ success: true, data: bookings });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const booking = await bookingService.getBookingById(req.params.id, req.user.id, req.user.role);
      if (!booking) {
        res.status(404).json({ success: false, error: { message: 'Booking not found' } });
        return;
      }
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  async addMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const booking = await bookingService.addMilestone(req.params.id, req.user.id, req.body);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  async uploadDeliveryProof(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const booking = await bookingService.uploadDeliveryProof(req.params.id, req.user.id, req.body);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
