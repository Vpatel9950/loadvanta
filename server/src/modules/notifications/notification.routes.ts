import { Router, Request, Response, NextFunction } from 'express';
import { Notification } from '../../infrastructure/database/models/Notification';
import { authenticate } from '../../middleware/auth';
import { Types } from 'mongoose';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const notifications = await Notification.find({ userId: new Types.ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: new Types.ObjectId(req.user.id),
      read: false
    });

    res.json({
      success: true,
      data: {
        items: notifications,
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(req.params.id), userId: new Types.ObjectId(req.user.id) },
      { $set: { read: true } },
      { new: true }
    );

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

router.post('/mark-all-read', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      return;
    }

    await Notification.updateMany(
      { userId: new Types.ObjectId(req.user.id), read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

export const notificationRoutes = router;
