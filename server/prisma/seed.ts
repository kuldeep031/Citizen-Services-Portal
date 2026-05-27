import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Ensure 'process' is available to the TypeScript compiler in environments
// where @types/node may not be installed.
declare const process: any;

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.refreshToken.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.complaintStatusHistory.deleteMany();
  await prisma.complaintDocument.deleteMany();
  await prisma.officerAssignment.deleteMany();
  await prisma.sLARecord.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: { name: 'Electricity', code: 'ELEC', description: 'Power supply, connections, billing, and street lighting', slaDefaultDays: 14 },
    }),
    prisma.department.create({
      data: { name: 'Water Supply', code: 'WATER', description: 'Water connections, quality, pressure, and leakage', slaDefaultDays: 10 },
    }),
    prisma.department.create({
      data: { name: 'Gas Services', code: 'GAS', description: 'Gas connections, safety inspections, and meter services', slaDefaultDays: 14 },
    }),
    prisma.department.create({
      data: { name: 'Waste Management', code: 'WASTE', description: 'Collection schedules, disposal, and cleanliness', slaDefaultDays: 7 },
    }),
    prisma.department.create({
      data: { name: 'Municipal Corporation', code: 'MUNI', description: 'Roads, drainage, public works, and infrastructure', slaDefaultDays: 21 },
    }),
  ]);

  const [elecDept, waterDept, gasDept, wasteDept, muniDept] = departments;

  // Create users
  const passwordHash = await bcrypt.hash('citizen123', 12);
  const officerHash = await bcrypt.hash('officer123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);

  const citizen = await prisma.user.create({
    data: { name: 'John Citizen', email: 'citizen@example.com', passwordHash, role: 'citizen', phone: '+91 98765 43210' },
  });

  const citizen2 = await prisma.user.create({
    data: { name: 'Anita Verma', email: 'anita@example.com', passwordHash, role: 'citizen', phone: '+91 98765 43211' },
  });

  const citizen3 = await prisma.user.create({
    data: { name: 'Ramesh Gupta', email: 'ramesh@example.com', passwordHash, role: 'citizen', phone: '+91 98765 43212' },
  });

  const officer1 = await prisma.user.create({
    data: { name: 'Rajesh Kumar', email: 'officer@example.com', passwordHash: officerHash, role: 'officer', departmentId: elecDept.id },
  });

  const officer2 = await prisma.user.create({
    data: { name: 'Priya Sharma', email: 'priya.officer@example.com', passwordHash: officerHash, role: 'officer', departmentId: waterDept.id },
  });

  const officer3 = await prisma.user.create({
    data: { name: 'Amit Patel', email: 'amit.officer@example.com', passwordHash: officerHash, role: 'officer', departmentId: muniDept.id },
  });

  await prisma.user.create({
    data: { name: 'Priya Sharma (Admin)', email: 'admin@example.com', passwordHash: adminHash, role: 'admin', departmentId: muniDept.id },
  });

  // Create complaints with status history
  const now = new Date();

  // Complaint 1: In Progress
  const c1 = await prisma.complaint.create({
    data: {
      ticketId: 'REQ-2024-001',
      title: 'Electricity Connection Request',
      description: 'Request for new electricity connection for residential property. All required documents submitted including property ownership proof and ID verification.',
      category: 'New Connection',
      priority: 'high',
      status: 'in_progress',
      location: '42, MG Road, Sector 12, New Delhi - 110001',
      citizenId: citizen.id,
      departmentId: elecDept.id,
      contactName: 'John Citizen',
      contactPhone: '+91 98765 43210',
      contactEmail: 'citizen@example.com',
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.sLARecord.create({
    data: {
      complaintId: c1.id,
      departmentId: elecDept.id,
      deadlineDays: 14,
      startDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      deadlineDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.officerAssignment.create({
    data: { complaintId: c1.id, officerId: officer1.id },
  });

  await prisma.complaintStatusHistory.createMany({
    data: [
      { complaintId: c1.id, fromStatus: 'none', toStatus: 'submitted', changedById: citizen.id, remarks: 'Complaint submitted', createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
      { complaintId: c1.id, fromStatus: 'submitted', toStatus: 'under_review', changedById: officer1.id, remarks: 'Documents verified successfully', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { complaintId: c1.id, fromStatus: 'under_review', toStatus: 'in_progress', changedById: officer1.id, remarks: 'Site inspection completed. Wiring verification pending.', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    ],
  });

  await prisma.receipt.create({ data: { complaintId: c1.id, ticketId: 'REQ-2024-001' } });

  // Complaint 2: Resolved
  const c2 = await prisma.complaint.create({
    data: {
      ticketId: 'REQ-2024-002',
      title: 'Water Supply Complaint',
      description: 'Low water pressure in the area for the past 2 weeks. Multiple households affected.',
      category: 'Low Pressure',
      priority: 'medium',
      status: 'resolved',
      location: '15, Nehru Nagar, Block C, Mumbai - 400001',
      citizenId: citizen.id,
      departmentId: waterDept.id,
      contactName: 'John Citizen',
      contactPhone: '+91 98765 43210',
      resolvedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.sLARecord.create({
    data: {
      complaintId: c2.id,
      departmentId: waterDept.id,
      deadlineDays: 10,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      deadlineDate: new Date(now.getTime()),
    },
  });

  await prisma.officerAssignment.create({
    data: { complaintId: c2.id, officerId: officer2.id },
  });

  await prisma.complaintStatusHistory.createMany({
    data: [
      { complaintId: c2.id, fromStatus: 'none', toStatus: 'submitted', changedById: citizen.id, remarks: 'Complaint submitted', createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      { complaintId: c2.id, fromStatus: 'submitted', toStatus: 'under_review', changedById: officer2.id, remarks: 'Field team dispatched', createdAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000) },
      { complaintId: c2.id, fromStatus: 'under_review', toStatus: 'in_progress', changedById: officer2.id, remarks: 'Damaged pipeline found at junction', createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { complaintId: c2.id, fromStatus: 'in_progress', toStatus: 'resolved', changedById: officer2.id, remarks: 'Pipeline repair completed. Pressure restored.', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
    ],
  });

  await prisma.receipt.create({ data: { complaintId: c2.id, ticketId: 'REQ-2024-002' } });

  // Complaint 3: Pending
  const c3 = await prisma.complaint.create({
    data: {
      ticketId: 'REQ-2024-003',
      title: 'Gas Connection Transfer',
      description: 'Request to transfer gas connection from previous owner to current owner after property purchase.',
      category: 'Transfer',
      priority: 'low',
      status: 'submitted',
      location: '8, Gandhi Colony, Pune - 411001',
      citizenId: citizen.id,
      departmentId: gasDept.id,
      contactName: 'John Citizen',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.sLARecord.create({
    data: {
      complaintId: c3.id,
      departmentId: gasDept.id,
      deadlineDays: 14,
      startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      deadlineDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.complaintStatusHistory.create({
    data: { complaintId: c3.id, fromStatus: 'none', toStatus: 'submitted', changedById: citizen.id, remarks: 'Complaint submitted', createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
  });

  await prisma.receipt.create({ data: { complaintId: c3.id, ticketId: 'REQ-2024-003' } });

  // Complaint 4: Street Light (from another citizen, assigned to officer1)
  const c4 = await prisma.complaint.create({
    data: {
      ticketId: 'REQ-2024-004',
      title: 'Street Light Repair',
      description: 'Street light near the park entrance has been non-functional for 10 days. Safety concern for evening walkers.',
      category: 'Street Light',
      priority: 'medium',
      status: 'under_review',
      location: '15, Park Avenue, Block B, New Delhi',
      citizenId: citizen2.id,
      departmentId: elecDept.id,
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.sLARecord.create({
    data: {
      complaintId: c4.id,
      departmentId: elecDept.id,
      deadlineDays: 14,
      startDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      deadlineDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.officerAssignment.create({
    data: { complaintId: c4.id, officerId: officer1.id },
  });

  await prisma.complaintStatusHistory.createMany({
    data: [
      { complaintId: c4.id, fromStatus: 'none', toStatus: 'submitted', changedById: citizen2.id, createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
      { complaintId: c4.id, fromStatus: 'submitted', toStatus: 'under_review', changedById: officer1.id, remarks: 'Inspection scheduled', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    ],
  });

  // Complaint 5: Water leakage (high priority, from citizen3)
  const c5 = await prisma.complaint.create({
    data: {
      ticketId: 'REQ-2024-005',
      title: 'Water Leakage on Main Road',
      description: 'Major water leakage causing road damage and water wastage. Needs urgent pipeline repair.',
      category: 'Leakage',
      priority: 'high',
      status: 'in_progress',
      location: 'Junction of NH-8 and Ring Road, Gurgaon',
      citizenId: citizen3.id,
      departmentId: waterDept.id,
      createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.sLARecord.create({
    data: {
      complaintId: c5.id,
      departmentId: waterDept.id,
      deadlineDays: 10,
      startDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      deadlineDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.officerAssignment.create({
    data: { complaintId: c5.id, officerId: officer2.id },
  });

  // Complaint 6: Drainage (resolved, municipal)
  const c6 = await prisma.complaint.create({
    data: {
      ticketId: 'REQ-2024-006',
      title: 'Drainage Blockage',
      description: 'Severe drainage blockage causing waterlogging during rains.',
      category: 'Drainage Block',
      priority: 'high',
      status: 'resolved',
      location: '3, Saket, New Delhi',
      citizenId: citizen2.id,
      departmentId: muniDept.id,
      resolvedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.sLARecord.create({
    data: {
      complaintId: c6.id,
      departmentId: muniDept.id,
      deadlineDays: 21,
      startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      deadlineDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.officerAssignment.create({
    data: { complaintId: c6.id, officerId: officer3.id },
  });

  // Complaint 7: Waste (from citizen)
  await prisma.complaint.create({
    data: {
      ticketId: 'REQ-2024-007',
      title: 'Waste Collection Schedule Change',
      description: 'Requesting change in waste collection schedule for our lane.',
      category: 'Schedule Change',
      priority: 'low',
      status: 'submitted',
      location: '7, Lajpat Nagar, South Delhi',
      citizenId: citizen.id,
      departmentId: wasteDept.id,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Notifications for citizen
  await prisma.notification.createMany({
    data: [
      { userId: citizen.id, title: 'Request Approved', message: 'Your water connection request has been approved.', type: 'success', complaintId: c2.id, createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { userId: citizen.id, title: 'Update Required', message: 'Please provide additional documents for REQ-2024-001.', type: 'info', complaintId: c1.id, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { userId: citizen.id, title: 'Payment Due', message: 'Electricity bill payment due in 3 days.', type: 'warning', createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { userId: citizen.id, title: 'SLA Breach Warning', message: 'REQ-2024-003 approaching deadline. Action required.', type: 'error', complaintId: c3.id, createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
    ],
  });

  // Announcements
  await prisma.announcement.createMany({
    data: [
      { title: 'Scheduled Water Maintenance', description: 'Water supply will be interrupted in Sector 12-15 on June 5, 2024 from 10 AM to 4 PM.', type: 'info', publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { title: 'New Online Payment Portal', description: 'Pay your electricity and water bills online through our new integrated payment system.', type: 'success', publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { title: 'Monsoon Preparedness Drive', description: 'Municipal Corporation initiating pre-monsoon drain cleaning across all zones.', type: 'info', publishedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log('Seed completed successfully!');
  console.log('Demo accounts:');
  console.log('  Citizen: citizen@example.com / citizen123');
  console.log('  Officer: officer@example.com / officer123');
  console.log('  Admin:   admin@example.com / admin123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
