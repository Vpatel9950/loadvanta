import { Router, Request, Response, NextFunction } from 'express';
import { ContactEnquiry } from '../../infrastructure/database/models/ContactEnquiry';
import { z } from 'zod';
import { validateBody } from '../../middleware/validateRequest';

const ContactSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

const router = Router();

router.post('/', validateBody(ContactSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enquiry = await ContactEnquiry.create(req.body);
    res.status(201).json({
      success: true,
      data: enquiry,
      message: 'Thank you for contacting Loadvanta. Our Punjab regional logistics team will respond shortly.'
    });
  } catch (error) {
    next(error);
  }
});

export const contactRoutes = router;
