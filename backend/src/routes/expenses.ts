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

const expenseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
  amount: z.coerce
    .number()
    .positive('Amount must be greater than 0')
    .max(1_000_000_000, 'Amount is too large'),
  category: z.enum(CATEGORIES),
  date: z.coerce.date(),
  notes: z.string().trim().max(500, 'Notes are too long').optional(),
})

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function toDto<T extends { amount: { toNumber(): number } }>(expense: T) {
  return { ...expense, amount: expense.amount.toNumber() }
}

// Authorization: the trip must belong to the logged-in user.
async function findOwnedTrip(tripId: string, userId: string) {
  return prisma.trip.findFirst({ where: { id: tripId, userId } })
}

router.get('/', async (req, res) => {
  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const expenses = await prisma.expense.findMany({
      where: { tripId: trip.id },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })
    return res.json(expenses.map(toDto))
  } catch (err) {
    console.error('List expenses failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', async (req, res) => {
  const result = expenseSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const { title, amount, category, date, notes } = result.data
    const expense = await prisma.expense.create({
      data: { title, amount: round2(amount), category, date, notes, tripId: trip.id },
    })
    return res.status(201).json(toDto(expense))
  } catch (err) {
    console.error('Create expense failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.put('/:expenseId', async (req, res) => {
  const result = expenseSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const existing = await prisma.expense.findFirst({
      where: { id: String(req.params.expenseId), tripId: trip.id },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    const { title, amount, category, date, notes } = result.data
    const expense = await prisma.expense.update({
      where: { id: existing.id },
      data: { title, amount: round2(amount), category, date, notes: notes ?? null },
    })
    return res.json(toDto(expense))
  } catch (err) {
    console.error('Update expense failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:expenseId', async (req, res) => {
  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const existing = await prisma.expense.findFirst({
      where: { id: String(req.params.expenseId), tripId: trip.id },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    await prisma.expense.delete({ where: { id: existing.id } })
    return res.status(204).send()
  } catch (err) {
    console.error('Delete expense failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router