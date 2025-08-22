import { Router } from 'express';
import { prisma } from '../prisma';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  const items = await prisma.item.findMany();
  res.json({ items });
});

const ItemSchema = z.object({ name: z.string().min(2), rarity: z.string().min(1), valueCents: z.number().int().nonnegative(), imageUrl: z.string().url().optional() });

router.post('/', requireAdmin, async (req, res) => {
  const parsed = ItemSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.item.create({ data: parsed.data });
  res.json({ item: created });
});

router.put('/:id', requireAdmin, async (req, res) => {
  const parsed = ItemSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.item.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ item: updated });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.item.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;