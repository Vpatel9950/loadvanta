import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';

export class PaymentController {
  async getStatus(_req: Request, res: Response): Promise<void> {
    const status = await paymentService.getPaymentStatus();
    res.json({ success: true, data: status });
  }

  async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const result = await paymentService.createPaymentOrder(req.body.bookingId, req.user.id);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const result = await paymentService.verifyPayment(req.body.bookingId, req.user.id, {
        razorpayOrderId: req.body.razorpayOrderId,
        razorpayPaymentId: req.body.razorpayPaymentId,
        razorpaySignature: req.body.razorpaySignature
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);
      const result = await paymentService.handleWebhook(rawBody, signature, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
