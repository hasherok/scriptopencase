import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res) => {
  const cases = await prisma.case.findMany({ where: { isActive: true }, include: { contents: { include: { item: true } } } });
  res.json({ cases });
});

router.get('/:slug', async (req, res) => {
  const kase = await prisma.case.findUnique({ where: { slug: req.params.slug }, include: { contents: { include: { item: true } } } });
  if (!kase) return res.status(404).json({ error: 'Not found' });
  res.json({ case: kase });
});

const CaseSchema = z.object({ name: z.string().min(2), slug: z.string().min(2), priceCents: z.number().int().positive(), isActive: z.boolean().optional() });

router.post('/', requireAdmin, async (req, res) => {
  const parsed = CaseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.case.create({ data: parsed.data });
  res.json({ case: created });
});

router.put('/:id', requireAdmin, async (req, res) => {
  const parsed = CaseSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const updated = await prisma.case.update({ where: { id: req.params.id }, data: parsed.data });
  res.json({ case: updated });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.case.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

const CaseContentSchema = z.object({ itemId: z.string().cuid(), weight: z.number().int().positive() });

router.post('/:id/contents', requireAdmin, async (req, res) => {
  const parsed = CaseContentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await prisma.caseContent.create({ data: { caseId: req.params.id, itemId: parsed.data.itemId, weight: parsed.data.weight } });
  res.json({ content: created });
});

router.delete('/contents/:contentId', requireAdmin, async (req, res) => {
  await prisma.caseContent.delete({ where: { id: req.params.contentId } });
  res.json({ ok: true });
});

export default router;