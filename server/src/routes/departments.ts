import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';

const router = Router();

// GET /api/departments — public list
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, description: true, slaDefaultDays: true },
      orderBy: { name: 'asc' },
    });
    res.json({ departments });
  } catch (err) {
    next(err);
  }
});

export default router;
