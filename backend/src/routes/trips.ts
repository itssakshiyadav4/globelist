import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

router.use(requireAuth)

const tripSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
    destination: z
      .string()
      .trim()
      .min(1, 'Destination is required')
      .max(100, 'Destination is too long'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    notes: z.string().trim().max(2000, 'Notes are too long').optional(),
  })
  .refine((t) => t.endDate >= t.startDate, {
    message: 'End date must be on or after the start date',
  })

router.post('/', async (req, res) => {
  const result = tripSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  try {
    const trip = await prisma.trip.create({
      data: { ...result.data, userId: res.locals.userId },
    })
    return res.status(201).json(trip)
  } catch (err) {
    console.error('Create trip failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { userId: res.locals.userId },
      orderBy: { startDate: 'asc' },
    })
    return res.json(trips)
  } catch (err) {
    console.error('List trips failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router