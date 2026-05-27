import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { complaintSchema, statusUpdateSchema } from '../utils/validators.js';
import { AppError, formatZodError } from '../utils/errors.js';
import { generateTicketId } from '../utils/ticketId.js';

const router = Router();

// POST /api/complaints — create a new complaint (citizen only)
router.post('/', authenticate, authorize('citizen'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = complaintSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, formatZodError(parsed.error));
    }

    const data = parsed.data;
    const ticketId = await generateTicketId();

    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) {
      throw new AppError(400, 'Invalid department');
    }

    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + department.slaDefaultDays);

    const result = await prisma.$transaction(async (tx) => {
      const complaint = await tx.complaint.create({
        data: {
          ticketId,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          location: data.location,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail || null,
          citizenId: req.user!.sub,
          departmentId: data.departmentId,
        },
        include: { department: { select: { name: true } } },
      });

      await tx.sLARecord.create({
        data: {
          complaintId: complaint.id,
          departmentId: data.departmentId,
          deadlineDays: department.slaDefaultDays,
          startDate: new Date(),
          deadlineDate: slaDeadline,
        },
      });

      await tx.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          fromStatus: 'none',
          toStatus: 'submitted',
          changedById: req.user!.sub,
          remarks: 'Complaint submitted',
        },
      });

      await tx.receipt.create({
        data: {
          complaintId: complaint.id,
          ticketId,
        },
      });

      await tx.notification.create({
        data: {
          userId: req.user!.sub,
          title: 'Complaint Submitted',
          message: `Your complaint "${data.title}" has been registered with ticket ID ${ticketId}.`,
          type: 'success',
          complaintId: complaint.id,
        },
      });

      return complaint;
    });

    res.status(201).json({
      complaint: {
        id: result.id,
        ticketId: result.ticketId,
        title: result.title,
        status: result.status,
        department: result.department.name,
        createdAt: result.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/complaints — list complaints
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedStatuses = ['submitted', 'under_review', 'in_progress', 'resolved', 'rejected'];
    const allowedPriorities = ['low', 'medium', 'high'];

    const where: Record<string, unknown> = {};

    // Role-based filtering
    if (req.user!.role === 'citizen') {
      where.citizenId = req.user!.sub;
    } else if (req.user!.role === 'officer') {
      where.assignments = { some: { officerId: req.user!.sub, unassignedAt: null } };
    }

    if (status && allowedStatuses.includes(status as string)) {
      where.status = status;
    }
    if (priority && allowedPriorities.includes(priority as string)) {
      where.priority = priority;
    }

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { name: true, code: true } },
          slaRecord: { select: { deadlineDate: true, isBreached: true } },
          assignments: { where: { unassignedAt: null }, include: { officer: { select: { id: true, name: true } } }, take: 1 },
        },
      }),
      prisma.complaint.count({ where }),
    ]);

    res.json({
      complaints: complaints.map((c) => ({
        id: c.id,
        ticketId: c.ticketId,
        title: c.title,
        category: c.category,
        priority: c.priority,
        status: c.status,
        department: c.department.name,
        departmentCode: c.department.code,
        departmentId: c.departmentId,
        location: c.location,
        slaDeadline: c.slaRecord?.deadlineDate,
        isBreached: c.slaRecord?.isBreached,
        assignedOfficer: c.assignments[0]?.officer ?? null,
        createdAt: c.createdAt,
      })),
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/complaints/stats — officer workload stats (must be before /:id)
router.get('/stats', authenticate, authorize('officer'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const baseWhere = { assignments: { some: { officerId: req.user!.sub, unassignedAt: null } } };

    const [total, pending, inProgress, resolved, breached] = await Promise.all([
      prisma.complaint.count({ where: baseWhere }),
      prisma.complaint.count({ where: { ...baseWhere, status: 'submitted' } }),
      prisma.complaint.count({ where: { ...baseWhere, status: { in: ['in_progress', 'under_review'] } } }),
      prisma.complaint.count({ where: { ...baseWhere, status: 'resolved' } }),
      prisma.complaint.count({
        where: {
          ...baseWhere,
          status: { notIn: ['resolved', 'rejected'] },
          slaRecord: { isBreached: true },
        },
      }),
    ]);

    res.json({ stats: { total, pending, inProgress, resolved, breached } });
  } catch (err) {
    next(err);
  }
});

// GET /api/complaints/:id — get complaint detail
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        department: { select: { name: true, code: true } },
        citizen: { select: { id: true, name: true, email: true, phone: true } },
        statusHistory: { orderBy: { createdAt: 'asc' }, include: { changedBy: { select: { name: true, role: true } } } },
        documents: { select: { id: true, fileName: true, fileSize: true, mimeType: true, createdAt: true } },
        assignments: { where: { unassignedAt: null }, include: { officer: { select: { id: true, name: true, email: true, department: { select: { name: true } } } } } },
        slaRecord: true,
        receipt: true,
      },
    });

    if (!complaint) {
      throw new AppError(404, 'Complaint not found');
    }

    // Citizens can only view their own
    if (req.user!.role === 'citizen' && complaint.citizenId !== req.user!.sub) {
      throw new AppError(403, 'Access denied');
    }

    res.json({ complaint });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/complaints/:id/status — update status (officer/admin)
router.patch('/:id/status', authenticate, authorize('officer', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, formatZodError(parsed.error));
    }

    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new AppError(404, 'Complaint not found');
    }

    const { status, remarks } = parsed.data;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
      },
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        fromStatus: complaint.status,
        toStatus: status,
        changedById: req.user!.sub,
        remarks,
      },
    });

    // Notify citizen
    await prisma.notification.create({
      data: {
        userId: complaint.citizenId,
        title: 'Status Updated',
        message: `Your complaint ${complaint.ticketId} status changed to "${status.replace('_', ' ')}".`,
        type: status === 'resolved' ? 'success' : 'info',
        complaintId: complaint.id,
      },
    });

    res.json({ complaint: updated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/complaints/:id/assign — assign officer (admin)
router.patch('/:id/assign', authenticate, authorize('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { officerId } = req.body;
    if (!officerId) {
      throw new AppError(400, 'Officer ID required');
    }

    const officer = await prisma.user.findUnique({ where: { id: officerId } });
    if (!officer || officer.role !== 'officer') {
      throw new AppError(400, 'Invalid officer');
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id as string },
      include: { assignments: { where: { unassignedAt: null }, include: { officer: { select: { name: true } } } } },
    });
    if (!complaint) {
      throw new AppError(404, 'Complaint not found');
    }

    if (complaint.status === 'resolved' || complaint.status === 'rejected') {
      throw new AppError(400, 'Cannot assign officer to a closed complaint');
    }

    // Unassign current officer if any
    await prisma.officerAssignment.updateMany({
      where: { complaintId: complaint.id, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });

    await prisma.officerAssignment.create({
      data: { complaintId: complaint.id, officerId },
    });

    // Auto-transition status from submitted → under_review
    const previousOfficer = complaint.assignments[0]?.officer?.name;
    let newStatus = complaint.status;
    if (complaint.status === 'submitted') {
      newStatus = 'under_review';
      await prisma.complaint.update({
        where: { id: complaint.id },
        data: { status: 'under_review' },
      });

      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          fromStatus: 'submitted',
          toStatus: 'under_review',
          changedById: req.user!.sub,
          remarks: `Assigned to ${officer.name}`,
        },
      });
    } else {
      // Log reassignment in history
      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: complaint.id,
          fromStatus: complaint.status,
          toStatus: complaint.status,
          changedById: req.user!.sub,
          remarks: previousOfficer
            ? `Reassigned from ${previousOfficer} to ${officer.name}`
            : `Assigned to ${officer.name}`,
        },
      });
    }

    // Notify the assigned officer
    await prisma.notification.create({
      data: {
        userId: officerId,
        title: 'New Assignment',
        message: `Complaint "${complaint.title}" (${complaint.ticketId}) has been assigned to you.`,
        type: 'info',
        complaintId: complaint.id,
      },
    });

    // Notify citizen about assignment
    await prisma.notification.create({
      data: {
        userId: complaint.citizenId,
        title: 'Officer Assigned',
        message: `Your complaint ${complaint.ticketId} has been assigned to ${officer.name} for review.`,
        type: 'info',
        complaintId: complaint.id,
      },
    });

    res.json({ message: 'Officer assigned successfully', status: newStatus });
  } catch (err) {
    next(err);
  }
});

export default router;
