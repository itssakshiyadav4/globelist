import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

describe('GET /api/health', () => {
  it('answers with status ok', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('protected routes without a login cookie', () => {
  it('blocks GET /api/trips', async () => {
    const res = await request(app).get('/api/trips')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Not logged in')
  })

  it('blocks GET /api/dashboard', async () => {
    const res = await request(app).get('/api/dashboard')

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Not logged in')
  })
})