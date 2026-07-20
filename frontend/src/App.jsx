import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Peta from './pages/Peta'
import Level from './pages/Level'
import Leaderboard from './pages/Leaderboard'
import Profil from './pages/Profil'
import Lab from './pages/Lab'
import Materi from './pages/Materi'
import DosenDashboard from './pages/DosenDashboard'
import KelolaSoal from './pages/KelolaSoal'
import KelolaMateri from './pages/KelolaMateri'
import Mahasiswa from './pages/Mahasiswa'

// Arahkan halaman utama sesuai peran.
function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'dosen' ? '/dosen' : '/peta'} replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <div className="app-shell">
    <Routes>
      {/* Halaman publik */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      {/* Halaman yang butuh login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/peta" element={<Peta />} />
          <Route path="/level/:id" element={<Level />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/materi" element={<Materi />} />
          <Route path="/dosen" element={<DosenDashboard />} />
          <Route path="/dosen/soal" element={<KelolaSoal />} />
          <Route path="/dosen/materi" element={<KelolaMateri />} />
          <Route path="/dosen/mahasiswa" element={<Mahasiswa />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </div>
  )
}
