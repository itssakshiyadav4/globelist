import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

type Category =
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'FOOD'
  | 'ACTIVITIES'
  | 'SHOPPING'
  | 'MISC'

type NextTrip = {
  id: string
  title: string
  destination: string
  startDate: string
  endDate: string
}

type DashboardData = {
  upcomingCount: number
  completedCount: number
  totalTrips: number
  nextTrips: NextTrip[]
  totalSpent: number
  totalBudget: number
  byCategory: Record<Category, number>
}

const CATEGORY_LABELS: Record<Category, string> = {
  TRANSPORT: '🚆 Transport',
  ACCOMMODATION: '🏨 Accommodation',
  FOOD: '🍽️ Food',
  ACTIVITIES: '🎟️ Activities',
  SHOPPING: '🛍️ Shopping',
  MISC: '📦 Misc',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d: DashboardData) => setData(d))
      .catch(() => setError('Could not load your dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500">Loading your dashboard...</p>

  if (error || !data) {
    return (
      <p className="rounded-lg bg-red-50 p-3 text-red-600">
        {error || 'Could not load your dashboard'}
      </p>
    )
  }

  const usedCategories = CATEGORIES.filter((c) => data.byCategory[c] > 0)

  const stats = [
    { label: 'Upcoming trips', value: String(data.upcomingCount), icon: '🧳' },
    { label: 'Completed trips', value: String(data.completedCount), icon: '✅' },
    { label: 'Total spent', value: money.format(data.totalSpent), icon: '💸' },
    { label: 'Total budgeted', value: money.format(data.totalBudget), icon: '🎯' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
        Hi{user ? `, ${user.name}` : ''} 👋
      </h1>
      <p className="mt-1 text-gray-600">Here's your travel at a glance.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-4 shadow-md">
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-xl font-bold text-gray-800 md:text-2xl">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Next trips</h2>
          <Link to="/trips" className="text-sm font-medium text-brand-700 hover:underline">
            All trips →
          </Link>
        </div>

        {data.nextTrips.length === 0 ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-brand-200 p-8 text-center text-gray-500">
            <p>No upcoming trips yet ✈️</p>
            <Link
              to="/trips"
              className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2 font-semibold text-white hover:bg-brand-700"
            >
              Plan your first trip
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 md:grid-cols-3">
            {data.nextTrips.map((trip) => (
              <li key={trip.id}>
                <Link
                  to={`/trips/${trip.id}`}
                  className="block rounded-2xl bg-white p-5 shadow-md hover:shadow-lg"
                >
                  <h3 className="font-bold text-gray-800">{trip.title}</h3>
                  <p className="mt-1 font-medium text-brand-600">📍 {trip.destination}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold text-gray-800">Spending by category</h2>

        {usedCategories.length === 0 ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-brand-200 p-8 text-center text-gray-500">
            No expenses yet. Add some from a trip's Budget section 🧾
          </div>
        ) : (
          <div className="mt-3 space-y-4 rounded-2xl bg-white p-5 shadow-md">
            {usedCategories.map((c) => {
              const amount = data.byCategory[c]
              const percent = data.totalSpent > 0 ? (amount / data.totalSpent) * 100 : 0
              return (
                <div key={c}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{CATEGORY_LABELS[c]}</span>
                    <span className="text-gray-600">{money.format(amount)}</span>
                  </div>
                  <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}