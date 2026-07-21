import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Batasi rute ke peran tertentu ('dosen' / 'mahasiswa').
// Kalau perannya tak cocok, arahkan ke "beranda" peran itu (bukan halaman buntu).
export default function RoleRoute({ role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    // Arahkan ke beranda perannya. Role tak dikenal -> /profil (hindari loop).
    const home = user.role === 'dosen' ? '/dosen'
      : user.role === 'mahasiswa' ? '/peta' : '/profil'
    return <Navigate to={home} replace />
  }
  return <Outlet />
}
