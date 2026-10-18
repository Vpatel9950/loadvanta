import { Request, Response, NextFunction } from 'express';
import { quotationService } from './quotation.service';

export class QuotationController {
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const quotation = await quotationService.submitQuotation(req.user.id, req.body);
      res.status(201).json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  }

  async getForShipment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotations = await quotationService.getQuotationsForShipment(req.params.shipmentId);
      res.json({ success: true, data: quotations });
    } catch (error) {
      next(error);
    }
  }

  async getMyQuotations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const quotations = await quotationService.getMyQuotations(req.user.id);
      res.json({ success: true, data: quotations });
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const quotation = await quotationService.withdrawQuotation(req.params.id, req.user.id);
      res.json({ success: true, data: quotation, message: 'Quotation withdrawn' });
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
        return;
      }
      const quotation = await quotationService.rejectQuotation(req.params.id, req.user.id);
      res.json({ success: true, data: quotation, message: 'Quotation rejected' });
    } catch (error) {
      next(error);
    }
  }
}

export const quotationController = new QuotationController();
