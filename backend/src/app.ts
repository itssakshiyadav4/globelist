import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth'
import tripsRouter from './routes/trips'
import itineraryRouter from './routes/itinerary'
import expensesRouter from './routes/expenses'
import budgetRouter from './routes/budget'
import dashboardRouter from './routes/dashboard'

export const app = express()

app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'GLOBElist backend is running' })
})

app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/trips/:tripId/items', itineraryRouter)
app.use('/api/trips/:tripId/expenses', expensesRouter)
app.use('/api/trips/:tripId/budget', budgetRouter)
app.use('/api/trips', tripsRouter)