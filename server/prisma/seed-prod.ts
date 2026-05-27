import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production database (admin + departments only)...');

  const departments = await Promise.all([
    prisma.department.create({ data: { name: 'Electricity', code: 'ELEC', description: 'Power supply, connections, billing, and street lighting', slaDefaultDays: 14 } }),
    prisma.department.create({ data: { name: 'Water Supply', code: 'WATER', description: 'Water connections, quality, pressure, and leakage', slaDefaultDays: 10 } }),
    prisma.department.create({ data: { name: 'Gas Services', code: 'GAS', description: 'Gas connections, safety inspections, and meter services', slaDefaultDays: 14 } }),
    prisma.department.create({ data: { name: 'Waste Management', code: 'WASTE', description: 'Collection schedules, disposal, and cleanliness', slaDefaultDays: 7 } }),
    prisma.department.create({ data: { name: 'Municipal Corporation', code: 'MUNI', description: 'Roads, drainage, public works, and infrastructure', slaDefaultDays: 21 } }),
  ]);

  const adminHash = await bcrypt.hash('admin123', 12);
  const muniDept = departments.find(d => d.code === 'MUNI')!;

  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@example.com', passwordHash: adminHash, role: 'admin', departmentId: muniDept.id },
  });

  console.log('Done!');
  console.log('Admin login: admin@example.com / admin123');
  console.log('Departments created: 5');

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
