import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/requireAuth'

const router = Router({ mergeParams: true })

router.use(requireAuth)

const CATEGORIES = [
  'TRANSPORT',
  'ACCOMMODATION',
  'FOOD',
  'ACTIVITIES',
  'SHOPPING',
  'MISC',
] as const

const budgetSchema = z.object({
  budget: z
    .number()
    .min(0, 'Budget cannot be negative')
    .max(1_000_000_000, 'Budget is too large')
    .nullable(),
})

async function findOwnedTrip(tripId: string, userId: string) {
  return prisma.trip.findFirst({ where: { id: tripId, userId } })
}

// Budget summary: the database does the adding up.
router.get('/', async (req, res) => {
  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const [total, groups] = await Promise.all([
      prisma.expense.aggregate({
        where: { tripId: trip.id },
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { tripId: trip.id },
        _sum: { amount: true },
      }),
    ])

    const spentExact = total._sum.amount
    const spent = spentExact ? spentExact.toNumber() : 0
    const remaining =
      trip.budget === null ? null : trip.budget.minus(spentExact ?? 0).toNumber()

    const byCategory: Record<string, number> = {}
    for (const c of CATEGORIES) byCategory[c] = 0
    for (const g of groups) {
      byCategory[g.category] = g._sum.amount ? g._sum.amount.toNumber() : 0
    }

    return res.json({
      budget: trip.budget === null ? null : trip.budget.toNumber(),
      spent,
      remaining,
      byCategory,
    })
  } catch (err) {
    console.error('Budget summary failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

// Set (or clear) the trip's total budget.
router.put('/', async (req, res) => {
  const result = budgetSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const { budget } = result.data
    const updated = await prisma.trip.update({
      where: { id: trip.id },
      data: { budget: budget === null ? null : Math.round(budget * 100) / 100 },
    })
    return res.json({ budget: updated.budget === null ? null : updated.budget.toNumber() })
  } catch (err) {
    console.error('Set budget failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router