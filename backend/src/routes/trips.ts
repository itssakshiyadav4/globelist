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

// The authorization check: a trip only counts if it belongs to this user.
async function findOwnedTrip(id: string, userId: string) {
  return prisma.trip.findFirst({ where: { id, userId } })
}

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

router.get('/:id', async (req, res) => {
  try {
    const trip = await findOwnedTrip(String(req.params.id), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    return res.json(trip)
  } catch (err) {
    console.error('Get trip failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.put('/:id', async (req, res) => {
  const result = tripSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  try {
    const existing = await findOwnedTrip(String(req.params.id), res.locals.userId)
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const trip = await prisma.trip.update({
      where: { id: existing.id },
      data: result.data,
    })
    return res.json(trip)
  } catch (err) {
    console.error('Update trip failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const existing = await findOwnedTrip(String(req.params.id), res.locals.userId)
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    await prisma.trip.delete({ where: { id: existing.id } })
    return res.status(204).send()
  } catch (err) {
    console.error('Delete trip failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router