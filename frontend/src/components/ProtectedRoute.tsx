import { Navigate } from 'react-router'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="text-gray-500">Loading...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}