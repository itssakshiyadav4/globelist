import { Routes, Route, useLocation } from 'react-router'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Trips from './pages/Trips'
import TripDetail from './pages/TripDetail'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl p-4">
        <div
          className={
            isHome
              ? ''
              : 'rounded-3xl bg-white/70 p-4 shadow-xl backdrop-blur-md md:p-6'
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips"
              element={
                <ProtectedRoute>
                  <Trips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:id"
              element={
                <ProtectedRoute>
                  <TripDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App