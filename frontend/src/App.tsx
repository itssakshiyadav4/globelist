import { Routes, Route } from 'react-router'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Trips from './pages/Trips'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <div className="min-h-screen bg-sky-50">
      <Navbar />
      <main className="mx-auto max-w-5xl p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <Trips />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  )
}

export default App