import { useEffect, useState } from 'react'

type Trip = {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
  notes: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function sortByStart(list: Trip[]) {
  return [...list].sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export default function Trips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/trips')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Trip[]) => setTrips(data))
      .catch(() => setLoadError('Could not load your trips'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          destination,
          startDate,
          endDate,
          notes: notes || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error ?? 'Could not save the trip')
        return
      }

      setTrips((prev) => sortByStart([...prev, data]))
      setTitle('')
      setDestination('')
      setStartDate('')
      setEndDate('')
      setNotes('')
    } catch {
      setFormError('Could not reach the server')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    setActionError('')

    try {
      const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setActionError('Could not delete the trip')
        return
      }
      setTrips((prev) => prev.filter((t) => t.id !== id))
    } catch {
      setActionError('Could not reach the server')
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 p-2 focus:border-brand-500 focus:outline-none'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">My Trips</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl bg-white p-6 shadow-md"
      >
        <h2 className="text-lg font-semibold text-gray-800">Plan a new trip</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Trip title
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
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
              Destination
            </label>
            <input
              id="destination"
              required
              maxLength={100}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              required
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </div>

        {formError && (
          <p className="mt-4 rounded-lg bg-red-50 p-2 text-sm text-red-600">{formError}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-full bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Add trip'}
        </button>
      </form>

      <div className="mt-8">
        {loading && <p className="text-gray-500">Loading your trips...</p>}

        {loadError && (
          <p className="rounded-lg bg-red-50 p-3 text-red-600">{loadError}</p>
        )}

        {actionError && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">{actionError}</p>
        )}

        {!loading && !loadError && trips.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-brand-200 p-8 text-center text-gray-500">
            No trips yet. Add your first one above ✈️
          </div>
        )}

        <ul className="grid gap-4 md:grid-cols-2">
          {trips.map((trip) => (
            <li key={trip.id} className="rounded-2xl bg-white p-5 shadow-md">
              <h3 className="text-lg font-bold text-gray-800">{trip.title}</h3>
              <p className="mt-1 font-medium text-brand-600">📍 {trip.destination}</p>
              <p className="mt-1 text-sm text-gray-500">
                {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
              </p>
              {trip.notes && <p className="mt-3 text-gray-600">{trip.notes}</p>}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="rounded-full border border-red-200 px-4 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}