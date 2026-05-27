import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createOfficerSchema } from '../utils/validators.js';
import { AppError, formatZodError } from '../utils/errors.js';

const router = Router();

// GET /api/admin/overview
router.get('/overview', authenticate, authorize('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalComplaints, resolved, pending, inProgress, activeOfficers, breachedSla] = await Promise.all([
      prisma.complaint.count(),
      prisma.complaint.count({ where: { status: 'resolved' } }),
      prisma.complaint.count({ where: { status: 'submitted' } }),
      prisma.complaint.count({ where: { status: { in: ['in_progress', 'under_review'] } } }),
      prisma.user.count({ where: { role: 'officer', isActive: true } }),
      prisma.sLARecord.count({ where: { isBreached: true } }),
    ]);

    res.json({
      stats: {
        totalComplaints,
        resolved,
        pending,
        inProgress,
        activeOfficers,
        breachedSla,
        slaCompliance: totalComplaints > 0 ? Math.round(((totalComplaints - breachedSla) / totalComplaints) * 100) : 100,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/departments
router.get('/departments', authenticate, authorize('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { complaints: true } },
      },
    });

    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const resolved = await prisma.complaint.count({
          where: { departmentId: dept.id, status: 'resolved' },
        });
        const breached = await prisma.sLARecord.count({
          where: { departmentId: dept.id, isBreached: true },
        });
        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          totalComplaints: dept._count.complaints,
          resolved,
          breached,
          slaCompliance: dept._count.complaints > 0
            ? Math.round(((dept._count.complaints - breached) / dept._count.complaints) * 100)
            : 100,
        };
      })
    );

    res.json({ departments: deptStats });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/officers
router.get('/officers', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const isActiveFilter = status === 'alumni' ? false : true;

    const officers = await prisma.user.findMany({
      where: { role: 'officer', isActive: isActiveFilter },
      include: {
        department: { select: { id: true, name: true } },
        assignedComplaints: {
          include: {
            complaint: { select: { status: true } },
          },
        },
      },
    });

    const officerStats = officers.map((officer) => {
      const assignments = officer.assignedComplaints;
      const resolved = assignments.filter((a) => a.complaint.status === 'resolved').length;
      return {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        phone: officer.phone,
        department: officer.department?.name,
        departmentId: officer.department?.id,
        isActive: officer.isActive,
        totalAssigned: assignments.length,
        resolved,
        active: assignments.filter((a) => a.unassignedAt === null && !['resolved', 'rejected'].includes(a.complaint.status)).length,
        createdAt: officer.createdAt,
      };
    });

    res.json({ officers: officerStats });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/monthly-trend
router.get('/monthly-trend', authenticate, authorize('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const complaints = await prisma.complaint.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true, resolvedAt: true },
    });

    const monthlyData: Record<string, { submitted: number; resolved: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    complaints.forEach((c) => {
      const month = months[c.createdAt.getMonth()];
      if (!monthlyData[month]) monthlyData[month] = { submitted: 0, resolved: 0 };
      monthlyData[month].submitted++;
      if (c.status === 'resolved') monthlyData[month].resolved++;
    });

    const trend = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));

    res.json({ trend });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/officers — create a new officer (admin only)
router.post('/officers', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createOfficerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, formatZodError(parsed.error));
    }

    const { name, email, password, phone, departmentId } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      throw new AppError(400, 'Invalid department');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const officer = await prisma.user.create({
      data: { name, email, passwordHash, phone, role: 'officer', departmentId },
      include: { department: { select: { name: true } } },
    });

    res.status(201).json({
      officer: {
        id: officer.id,
        name: officer.name,
        email: officer.email,
        department: officer.department?.name,
        phone: officer.phone,
        createdAt: officer.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/officers/:id/deactivate — mark officer as alumni
router.patch('/officers/:id/deactivate', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const officerId = req.params.id as string;
    const officer = await prisma.user.findUnique({ where: { id: officerId } });
    if (!officer || officer.role !== 'officer') {
      throw new AppError(404, 'Officer not found');
    }

    if (!officer.isActive) {
      throw new AppError(400, 'Officer is already deactivated');
    }

    // Unassign all active complaints
    await prisma.officerAssignment.updateMany({
      where: { officerId, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: officerId },
      data: { isActive: false },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId: officerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    res.json({ message: `Officer "${officer.name}" has been marked as alumni` });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/officers/:id/reactivate — reactivate alumni officer
router.patch('/officers/:id/reactivate', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const officerId = req.params.id as string;
    const officer = await prisma.user.findUnique({ where: { id: officerId } });
    if (!officer || officer.role !== 'officer') {
      throw new AppError(404, 'Officer not found');
    }

    if (officer.isActive) {
      throw new AppError(400, 'Officer is already active');
    }

    await prisma.user.update({
      where: { id: officerId },
      data: { isActive: true },
    });

    res.json({ message: `Officer "${officer.name}" has been reactivated` });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/officers-by-department/:departmentId — for assignment dropdown
router.get('/officers-by-department/:departmentId', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const departmentId = req.params.departmentId as string;
    const officers = await prisma.user.findMany({
      where: { role: 'officer', isActive: true, departmentId },
      select: { id: true, name: true, email: true, phone: true },
    });
    res.json({ officers });
  } catch (err) {
    next(err);
  }
});

export default router;
