import express from 'express'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth'
import tripsRouter from './routes/trips'

const app = express()
const PORT = 3000

app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'GLOBElist backend is running' })
})

app.use('/api/auth', authRouter)
app.use('/api/trips', tripsRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})