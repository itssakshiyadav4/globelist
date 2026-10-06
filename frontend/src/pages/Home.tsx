import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <section className="mt-4 rounded-3xl bg-linear-to-br from-brand-400 via-brand-500 to-brand-700 p-8 text-white shadow-xl md:p-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand-100">
        Your travel command center
      </p>
      <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-6xl">
        Plan the trip.
        <br />
        Keep the memories.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-brand-50">
        GLOBElist helps you plan trips, track spending, and remember every
        journey, all in one place.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <Link
            to="/trips"
            className="rounded-full bg-white px-6 py-3 font-semibold text-brand-700 shadow hover:bg-brand-50"
          >
            Go to my trips
          </Link>
        ) : (
          <>
            <Link
              to="/register"
              className="rounded-full bg-white px-6 py-3 font-semibold text-brand-700 shadow hover:bg-brand-50"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Log in
            </Link>
          </>
        )}
      </div>
    </section>
  )
}