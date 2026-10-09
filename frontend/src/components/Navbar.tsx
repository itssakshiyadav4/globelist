import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 bg-white/80 shadow-sm backdrop-blur-md">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link to="/" className="text-xl font-bold text-brand-700">
          GLOBElist 🌍
        </Link>
        <div className="flex items-center gap-4 text-sm text-gray-600 md:gap-8 md:text-base">
          <Link to="/trips" className="hover:text-brand-600">Trips</Link>
          {!loading && user && (
            <>
              <span className="font-medium text-gray-800">{user.name}</span>
              <button onClick={handleLogout} className="hover:text-brand-600">
                Logout
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link to="/login" className="hover:text-brand-600">Login</Link>
              <Link to="/register" className="hover:text-brand-600">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}