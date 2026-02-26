import { Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner />
      </Box>
    )
  }

  if (!currentUser) {
    return <Navigate to="/" replace />
  }

  if (requireAdmin && !currentUser.isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
