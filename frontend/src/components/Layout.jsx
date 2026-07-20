import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [theme, setTheme] = useState(document.documentElement.dataset.theme)
  const [stats, setStats] = useState(null)
  const [kelasAktif, setKelasAktif] = useState(null)

  // Ambil statistik (XP, koin) + kelas aktif tiap pindah halaman.
  useEffect(() => {
    if (user?.role === 'mahasiswa') {
      client.get('/me/stats').then((r) => setStats(r.data)).catch(() => {})
    }
    client.get('/kelas/aktif')
      .then((r) => setKelasAktif(r.data.aktif ? r.data : null)).catch(() => {})
  }, [loc.pathname, user])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  const chip = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 999, padding: '.25rem .7rem', fontSize: '.85rem',
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-3"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <Link to="/" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text)' }}>
            🐍 PyQuest
          </Link>
          {kelasAktif && (
            <Link to="/kelas" title="Ganti kelas" style={{ ...chip, color: 'var(--text)', textDecoration: 'none' }}>
              📚 {kelasAktif.matkul}
            </Link>
          )}
        </div>

        <nav className="flex items-center gap-4" style={{ fontSize: '.92rem' }}>
          {user?.role === 'mahasiswa' && (
            <>
              <Link to="/kelas" style={{ color: 'var(--text)' }}>Kelas</Link>
              <Link to="/peta" style={{ color: 'var(--text)' }}>Peta</Link>
              <Link to="/tes-harian" style={{ color: 'var(--text)' }}>Tes</Link>
              <Link to="/materi" style={{ color: 'var(--text)' }}>Materi</Link>
              <Link to="/lab" style={{ color: 'var(--text)' }}>Lab</Link>
              <Link to="/leaderboard" style={{ color: 'var(--text)' }}>Papan Skor</Link>
              <Link to="/profil" style={{ color: 'var(--text)' }}>Profil</Link>
            </>
          )}
          {user?.role === 'dosen' && (
            <>
              <Link to="/kelas" style={{ color: 'var(--text)' }}>Kelas</Link>
              <Link to="/dosen" style={{ color: 'var(--text)' }}>Dashboard</Link>
              <Link to="/dosen/soal" style={{ color: 'var(--text)' }}>Kelola Soal</Link>
              <Link to="/dosen/tes" style={{ color: 'var(--text)' }}>Kelola Tes</Link>
              <Link to="/dosen/materi" style={{ color: 'var(--text)' }}>Kelola Materi</Link>
              <Link to="/dosen/mahasiswa" style={{ color: 'var(--text)' }}>Mahasiswa</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {stats && (
            <>
              <span style={chip}>🪙 {stats.koin}</span>
              <span style={chip}>⭐ {stats.total_stars}</span>
              <span style={chip}>Lv {stats.player_level}</span>
            </>
          )}
          <button className="btn btn-ghost" onClick={toggleTheme} title="Ganti tema"
                  style={{ padding: '.4rem .6rem' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-ghost" onClick={() => { logout(); nav('/login') }}
                  style={{ padding: '.4rem .8rem' }}>
            Keluar
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 980, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
