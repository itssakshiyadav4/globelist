import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.use(requireAuth)

const CATEGORIES = [
  'TRANSPORT',
  'ACCOMMODATION',
  'FOOD',
  'ACTIVITIES',
  'SHOPPING',
  'MISC',
] as const

router.get('/', async (_req, res) => {
  const userId: string = res.locals.userId

  // "Today" at midnight UTC, matching how trip dates are stored.
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  try {
    const [
      upcomingCount,
      completedCount,
      nextTrips,
      spentAgg,
      budgetAgg,
      categoryGroups,
    ] = await Promise.all([
      prisma.trip.count({ where: { userId, endDate: { gte: today } } }),
      prisma.trip.count({ where: { userId, endDate: { lt: today } } }),
      prisma.trip.findMany({
        where: { userId, endDate: { gte: today } },
        orderBy: { startDate: 'asc' },
        take: 3,
        select: {
          id: true,
          title: true,
          destination: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.expense.aggregate({
        where: { trip: { userId } },
        _sum: { amount: true },
      }),
      prisma.trip.aggregate({
        where: { userId },
        _sum: { budget: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { trip: { userId } },
        _sum: { amount: true },
      }),
    ])

    const byCategory: Record<string, number> = {}
    for (const c of CATEGORIES) byCategory[c] = 0
    for (const g of categoryGroups) {
      byCategory[g.category] = g._sum.amount ? g._sum.amount.toNumber() : 0
    }

    return res.json({
      upcomingCount,
      completedCount,
      totalTrips: upcomingCount + completedCount,
      nextTrips,
      totalSpent: spentAgg._sum.amount ? spentAgg._sum.amount.toNumber() : 0,
      totalBudget: budgetAgg._sum.budget ? budgetAgg._sum.budget.toNumber() : 0,
      byCategory,
    })
  } catch (err) {
    console.error('Dashboard failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router