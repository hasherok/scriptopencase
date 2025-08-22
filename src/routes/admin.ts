import { Router } from 'express';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

router.use(requireAdmin);

router.get('/config', async (_req, res) => {
  let config = await prisma.config.findUnique({ where: { id: 1 } });
  if (!config) config = await prisma.config.create({ data: { id: 1 } });
  res.json({ config });
});

const ConfigSchema = z.object({
  globalProfitChanceBp: z.number().int().min(-100).max(100),
  houseEdgeBp: z.number().int().min(0).max(5000)
});

router.put('/config', async (req, res) => {
  const parsed = ConfigSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.config.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data
  });
  res.json({ config: updated });
});

router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, email: true, username: true, role: true, balanceCents: true, profitChanceBasis: true } });
  res.json({ users });
});

const UserAdjustSchema = z.object({ amountCents: z.number().int() });
router.post('/users/:id/balance', async (req, res) => {
  const parsed = UserAdjustSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { balanceCents: { increment: parsed.data.amountCents } }, select: { id: true, balanceCents: true } });
  res.json({ user });
});

const ProfitBasisSchema = z.object({ profitChanceBasis: z.number().int().min(-100).max(100) });
router.post('/users/:id/profit-basis', async (req, res) => {
  const parsed = ProfitBasisSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { profitChanceBasis: parsed.data.profitChanceBasis }, select: { id: true, profitChanceBasis: true } });
  res.json({ user });
});

export default router;