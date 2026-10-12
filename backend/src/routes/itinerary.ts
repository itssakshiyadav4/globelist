import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/requireAuth'

const router = Router({ mergeParams: true })

router.use(requireAuth)

const itemSchema = z.object({
  date: z.coerce.date(),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM')
    .optional(),
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title is too long'),
  location: z.string().trim().max(100, 'Location is too long').optional(),
  notes: z.string().trim().max(1000, 'Notes are too long').optional(),
})

// Authorization step 1: the trip must belong to the logged-in user.
async function findOwnedTrip(tripId: string, userId: string) {
  return prisma.trip.findFirst({ where: { id: tripId, userId } })
}

function outsideTrip(date: Date, trip: { startDate: Date; endDate: Date }) {
  return date < trip.startDate || date > trip.endDate
}

router.get('/', async (req, res) => {
  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const items = await prisma.itineraryItem.findMany({
      where: { tripId: trip.id },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })
    return res.json(items)
  } catch (err) {
    console.error('List itinerary failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', async (req, res) => {
  const result = itemSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    if (outsideTrip(result.data.date, trip)) {
      return res.status(400).json({ error: 'Date must be within the trip dates' })
    }

    const item = await prisma.itineraryItem.create({
      data: { ...result.data, tripId: trip.id },
    })
    return res.status(201).json(item)
  } catch (err) {
    console.error('Create itinerary item failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.put('/:itemId', async (req, res) => {
  const result = itemSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }

  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    // Authorization step 2: the item must belong to that trip.
    const existing = await prisma.itineraryItem.findFirst({
      where: { id: String(req.params.itemId), tripId: trip.id },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' })
    }
    if (outsideTrip(result.data.date, trip)) {
      return res.status(400).json({ error: 'Date must be within the trip dates' })
    }

    const { date, time, title, location, notes } = result.data
    const item = await prisma.itineraryItem.update({
      where: { id: existing.id },
      data: {
        date,
        title,
        time: time ?? null,
        location: location ?? null,
        notes: notes ?? null,
      },
    })
    return res.json(item)
  } catch (err) {
    console.error('Update itinerary item failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:itemId', async (req, res) => {
  try {
    const trip = await findOwnedTrip(String(req.params.tripId), res.locals.userId)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }

    const existing = await prisma.itineraryItem.findFirst({
      where: { id: String(req.params.itemId), tripId: trip.id },
    })
    if (!existing) {
      return res.status(404).json({ error: 'Item not found' })
    }

    await prisma.itineraryItem.delete({ where: { id: existing.id } })
    return res.status(204).send()
  } catch (err) {
    console.error('Delete itinerary item failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router