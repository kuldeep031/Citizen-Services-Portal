import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.sub, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all — must come before /:id/read
router.patch('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.sub, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.user!.sub },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
});

export default router;
