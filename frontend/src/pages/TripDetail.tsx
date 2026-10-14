import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

type Trip = {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
}

type Item = {
  id: string
  date: string
  time: string | null
  title: string
  location: string | null
  notes: string | null
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function sortItems(list: Item[]) {
  return [...list].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate
    return (a.time ?? '99:99').localeCompare(b.time ?? '99:99')
  })
}

export default function TripDetail() {
  const { id } = useParams()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([fetch(`/api/trips/${id}`), fetch(`/api/trips/${id}/items`)])
      .then(async ([tripRes, itemsRes]) => {
        if (!tripRes.ok || !itemsRes.ok) throw new Error('load failed')
        setTrip(await tripRes.json())
        setItems(await itemsRes.json())
      })
      .catch(() => setLoadError('Could not load this trip'))
      .finally(() => setLoading(false))
  }, [id])

  function resetForm() {
    setEditingId(null)
    setDate('')
    setTime('')
    setTitle('')
    setLocation('')
    setNotes('')
    setFormError('')
  }

  function handleEdit(item: Item) {
    setEditingId(item.id)
    setDate(item.date.slice(0, 10))
    setTime(item.time ?? '')
    setTitle(item.title)
    setLocation(item.location ?? '')
    setNotes(item.notes ?? '')
    setFormError('')
    setActionError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    const url = editingId
      ? `/api/trips/${id}/items/${editingId}`
      : `/api/trips/${id}/items`
    const method = editingId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time: time || undefined,
          title,
          location: location || undefined,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error ?? 'Could not save the activity')
        return
      }

      if (editingId) {
        setItems((prev) => sortItems(prev.map((i) => (i.id === editingId ? data : i))))
      } else {
        setItems((prev) => sortItems([...prev, data]))
      }
      resetForm()
    } catch {
      setFormError('Could not reach the server')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(itemId: string) {
    if (!window.confirm('Delete this activity?')) return
    setActionError('')

    try {
      const res = await fetch(`/api/trips/${id}/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        setActionError('Could not delete the activity')
        return
      }
      setItems((prev) => prev.filter((i) => i.id !== itemId))
      if (editingId === itemId) resetForm()
    } catch {
      setActionError('Could not reach the server')
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-brand-500 focus:outline-none'

  if (loading) return <p className="text-gray-500">Loading...</p>

  if (loadError || !trip) {
    return (
      <div>
        <p className="rounded-lg bg-red-50 p-3 text-red-600">
          {loadError || 'Trip not found'}
        </p>
        <Link to="/trips" className="mt-4 inline-block text-brand-700 hover:underline">
          ← Back to my trips
        </Link>
      </div>
    )
  }

  const tripStart = trip.startDate.slice(0, 10)
  const tripEnd = trip.endDate.slice(0, 10)

  const byDay: Record<string, Item[]> = {}
  for (const item of items) {
    const key = item.date.slice(0, 10)
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(item)
  }
  const dayKeys = Object.keys(byDay).sort()

  return (
    <div>
      <Link to="/trips" className="text-sm text-brand-700 hover:underline">
        ← Back to my trips
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-gray-800 md:text-3xl">{trip.title}</h1>
      <p className="mt-1 font-medium text-brand-700">📍 {trip.destination}</p>
      <p className="text-sm text-gray-500">
        {formatShort(trip.startDate)} → {formatShort(trip.endDate)}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-gray-800">
          {editingId ? 'Edit activity' : 'Add an activity'}
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              id="date"
              type="date"
              required
              min={tripStart}
              max={tripEnd}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Time (optional)
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Activity
            </label>
            <input
              id="title"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location (optional)
            </label>
            <input
              id="location"
              maxLength={100}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>

        {formError && (
          <p className="mt-4 rounded-lg bg-red-50 p-2 text-sm text-red-600">{formError}</p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add activity'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-gray-300 px-6 py-2 font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="mt-8">
        {actionError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">{actionError}</p>
        )}

        {items.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-brand-200 p-8 text-center text-gray-500">
            No activities yet. Plan your first day above 🗺️
          </div>
        )}

        <div className="space-y-6">
          {dayKeys.map((key) => {
            const dayNumber =
              Math.round((Date.parse(key) - Date.parse(tripStart)) / 86400000) + 1
            return (
              <section key={key}>
                <h3 className="text-lg font-bold text-gray-800">
                  Day {dayNumber}
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    {formatDay(`${key}T00:00:00.000Z`)}
                  </span>
                </h3>

                <ul className="mt-2 space-y-3">
                  {byDay[key].map((item) => (
                    <li key={item.id} className="rounded-2xl bg-white p-4 shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {item.time && (
                              <span className="mr-2 rounded-full bg-brand-100 px-2 py-0.5 text-sm font-medium text-brand-800">
                                {item.time}
                              </span>
                            )}
                            {item.title}
                          </p>
                          {item.location && (
                            <p className="mt-1 text-sm text-brand-700">📍 {item.location}</p>
                          )}
                          {item.notes && (
                            <p className="mt-2 text-sm text-gray-600">{item.notes}</p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-full border border-brand-200 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-full border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}