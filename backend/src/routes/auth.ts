import 'dotenv/config'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in .env')
}

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long'),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required').max(72, 'Password is too long'),
})

router.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }
  const { name, email, password } = result.data

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    return res.status(201).json(user)
  } catch (err) {
    console.error('Register failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message })
  }
  const { email, password } = result.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    const passwordOk = user ? await bcrypt.compare(password, user.passwordHash) : false

    if (!user || !passwordOk) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' })

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return res.json({ id: user.id, name: user.name, email: user.email })
  } catch (err) {
    console.error('Login failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.get('/me', requireAuth, async (_req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: res.locals.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    if (!user) {
      return res.status(401).json({ error: 'Not logged in' })
    }
    return res.json(user)
  } catch (err) {
    console.error('Me failed:', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return res.json({ message: 'Logged out' })
})

export default router