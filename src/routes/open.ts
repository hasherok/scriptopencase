import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../prisma';

const router = Router();

function pickWeighted<T extends { weight: number }>(items: T[]): T | null {
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const item of items) {
    if ((r -= item.weight) <= 0) return item;
  }
  return items[items.length - 1] ?? null;
}

router.post('/:caseId', requireAuth, async (req, res) => {
  const userId = (req as any).user.id as string;
  const kase = await prisma.case.findUnique({ where: { id: req.params.caseId }, include: { contents: { include: { item: true } } } });
  if (!kase || !kase.isActive) return res.status(404).json({ error: 'Case not found' });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.balanceCents < kase.priceCents) return res.status(400).json({ error: 'Insufficient balance' });

  // Load config
  let config = await prisma.config.findUnique({ where: { id: 1 } });
  if (!config) {
    config = await prisma.config.create({ data: { id: 1, globalProfitChanceBp: 0, houseEdgeBp: 500 } });
  }

  // Compute effective profit chance in basis points
  const baseEdge = config.houseEdgeBp; // house edge applied on expected value
  const profitAdjustBp = Math.max(-100, Math.min(100, config.globalProfitChanceBp + (user.profitChanceBasis || 0)));

  // We model profit chance by adjusting weights to bias toward below- or above-price items
  const contents = kase.contents.map(c => ({ ...c, item: c.item }));
  const cheaper = contents.filter(c => c.item.valueCents <= kase.priceCents);
  const expensive = contents.filter(c => c.item.valueCents > kase.priceCents);

  const bias = profitAdjustBp / 100; // percentage -1..+1
  const adjusted = contents.map(c => {
    const isProfit = c.item.valueCents > kase.priceCents;
    const factor = isProfit ? (1 + bias) : (1 - bias);
    // Apply house edge by slightly reducing profitable outcomes
    const edgeFactor = isProfit ? Math.max(0.01, 1 - baseEdge / 10000) : 1;
    const newWeight = Math.max(1, Math.round(c.weight * factor * edgeFactor));
    return { ...c, weight: newWeight };
  });

  const picked = pickWeighted(adjusted);
  if (!picked) return res.status(500).json({ error: 'Case has no contents' });

  const profit = picked.item.valueCents >= kase.priceCents;

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({ where: { id: userId }, data: { balanceCents: { decrement: kase.priceCents } } });
    const opening = await tx.opening.create({
      data: {
        userId,
        caseId: kase.id,
        itemId: picked.itemId,
        casePriceCents: kase.priceCents,
        itemValueCents: picked.item.valueCents,
        profit
      },
      include: { item: true }
    });
    return { opening, updatedUser };
  });

  res.json({ opening: result.opening });
});

export default router;