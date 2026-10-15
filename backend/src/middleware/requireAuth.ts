import 'dotenv/config'
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET
if (!secret) {
  throw new Error('JWT_SECRET is not set in .env')
}
const JWT_SECRET: string = secret

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).json({ error: 'Not logged in' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload
    res.locals.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}