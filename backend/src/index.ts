import express from 'express'
import authRouter from './routes/auth'

const app = express()
const PORT = 3000

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'GLOBElist backend is running' })
})

app.use('/api/auth', authRouter)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})