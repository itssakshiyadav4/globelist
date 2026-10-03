import express from 'express'

const app = express()
const PORT = 3000

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'GLOBElist backend is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})