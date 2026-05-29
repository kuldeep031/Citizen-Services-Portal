import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';

const router = Router();

// GET /api/announcements — public
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    res.json({ announcements });
  } catch (err) {
    next(err);
  }
});

// GET /api/announcements/public-stats — public portal stats for homepage
router.get('/public-stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    const [totalResolved, totalCitizens, departmentCount] = await Promise.all([
      prisma.complaint.count({ where: { status: 'resolved' } }),
      prisma.user.count({ where: { role: 'citizen' } }),
      prisma.department.count(),
    ]);

    const resolvedComplaints = await prisma.complaint.findMany({
      where: { status: 'resolved', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true },
      take: 500,
      orderBy: { resolvedAt: 'desc' },
    });

    let avgResolutionDays = 0;
    if (resolvedComplaints.length > 0) {
      const totalDays = resolvedComplaints.reduce((sum, c) => {
        const diff = (c.resolvedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      avgResolutionDays = Math.round((totalDays / resolvedComplaints.length) * 10) / 10;
    }

    res.json({
      stats: {
        complaintsResolved: totalResolved,
        activeCitizens: totalCitizens,
        avgResolutionDays,
        departmentsServed: departmentCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
