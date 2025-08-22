import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { env } from '../src/env';

const prisma = new PrismaClient();

async function main() {
  await prisma.config.upsert({ where: { id: 1 }, create: { id: 1, globalProfitChanceBp: 0, houseEdgeBp: 500 }, update: {} });

  const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { username: env.ADMIN_USERNAME, role: 'ADMIN' },
    create: { email: env.ADMIN_EMAIL, username: env.ADMIN_USERNAME, passwordHash: adminPasswordHash, role: 'ADMIN' as Role, balanceCents: 100000 }
  });

  const low = await prisma.item.create({ data: { name: 'Common Skin', rarity: 'Common', valueCents: 50 } });
  const mid = await prisma.item.create({ data: { name: 'Rare Skin', rarity: 'Rare', valueCents: 1000 } });
  const high = await prisma.item.create({ data: { name: 'Legendary Skin', rarity: 'Legendary', valueCents: 5000 } });

  const kase = await prisma.case.create({ data: { name: 'Starter Case', slug: 'starter', priceCents: 200, isActive: true } });
  await prisma.caseContent.createMany({ data: [
    { caseId: kase.id, itemId: low.id, weight: 900 },
    { caseId: kase.id, itemId: mid.id, weight: 90 },
    { caseId: kase.id, itemId: high.id, weight: 10 }
  ] });

  console.log('Seed completed. Admin:', admin.email);
}

main().finally(async () => prisma.$disconnect());