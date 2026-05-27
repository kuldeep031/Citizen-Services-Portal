import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// GET /api/tracking/:ticketId — public tracking
router.get('/:ticketId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { ticketId: (req.params.ticketId as string).toUpperCase() },
      include: {
        department: { select: { name: true } },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: { changedBy: { select: { name: true, role: true } } },
        },
        assignments: {
          where: { unassignedAt: null },
          include: { officer: { select: { name: true, department: { select: { name: true } } } } },
        },
        slaRecord: true,
      },
    });

    if (!complaint) {
      throw new AppError(404, 'No application found with that ticket ID');
    }

    const officer = complaint.assignments[0]?.officer;

    res.json({
      application: {
        id: complaint.id,
        ticketId: complaint.ticketId,
        title: complaint.title,
        description: complaint.description,
        department: complaint.department.name,
        category: complaint.category,
        priority: complaint.priority,
        status: complaint.status,
        location: complaint.location,
        submittedDate: complaint.createdAt,
        slaDeadline: complaint.slaRecord?.deadlineDate,
        daysRemaining: complaint.slaRecord
          ? Math.max(0, Math.ceil((complaint.slaRecord.deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null,
        isBreached: complaint.slaRecord?.isBreached,
        officer: officer ? { name: officer.name, department: officer.department?.name } : null,
        timeline: complaint.statusHistory.map((h) => ({
          title: formatStatusTitle(h.toStatus),
          description: h.remarks || formatStatusDescription(h.toStatus),
          date: h.createdAt,
          changedBy: h.changedBy.name,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/tracking/:ticketId/receipt — download receipt as JSON (frontend renders it)
router.get('/:ticketId/receipt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { ticketId: (req.params.ticketId as string).toUpperCase() },
      include: {
        department: { select: { name: true } },
        receipt: true,
        citizen: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!complaint) {
      throw new AppError(404, 'No application found with that ticket ID');
    }

    if (!complaint.receipt) {
      throw new AppError(404, 'Receipt not available for this complaint');
    }

    res.json({
      receipt: {
        ticketId: complaint.ticketId,
        title: complaint.title,
        category: complaint.category,
        department: complaint.department.name,
        priority: complaint.priority,
        location: complaint.location,
        citizen: complaint.citizen,
        contactName: complaint.contactName,
        contactPhone: complaint.contactPhone,
        submittedAt: complaint.createdAt,
        receiptGeneratedAt: complaint.receipt.generatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

function formatStatusTitle(status: string): string {
  const map: Record<string, string> = {
    submitted: 'Complaint Submitted',
    under_review: 'Under Review',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };
  return map[status] || status;
}

function formatStatusDescription(status: string): string {
  const map: Record<string, string> = {
    submitted: 'Application received and registered',
    under_review: 'Being reviewed by assigned officer',
    in_progress: 'Work in progress',
    resolved: 'Issue has been resolved',
    rejected: 'Application has been rejected',
  };
  return map[status] || '';
}

export default router;
