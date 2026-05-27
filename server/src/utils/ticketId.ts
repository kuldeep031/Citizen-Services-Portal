import { prisma } from '../config/database.js';

let ticketCounter: number | null = null;

export async function generateTicketId(): Promise<string> {
  if (ticketCounter === null) {
    const lastComplaint = await prisma.complaint.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { ticketId: true },
    });
    if (lastComplaint) {
      const num = parseInt(lastComplaint.ticketId.split('-').pop() || '0', 10);
      ticketCounter = num;
    } else {
      ticketCounter = 0;
    }
  }
  ticketCounter++;
  const year = new Date().getFullYear();
  return `REQ-${year}-${String(ticketCounter).padStart(3, '0')}`;
}
