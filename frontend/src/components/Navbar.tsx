import { Link } from 'react-router'

export default function Navbar() {
  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link to="/" className="text-xl font-bold text-sky-600">
          GLOBElist 🌍
        </Link>
        <div className="flex gap-4 text-sm text-gray-600 md:gap-8 md:text-base">
          <Link to="/trips" className="hover:text-sky-600">Trips</Link>
          <Link to="/login" className="hover:text-sky-600">Login</Link>
          <Link to="/register" className="hover:text-sky-600">Sign up</Link>
        </div>
      </nav>
    </header>
  )
}