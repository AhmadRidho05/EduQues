import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import client from '../api/client'
import Logo from './Logo'
import Icon from './Icon'

const MENU_MAHASISWA = [
  { to: '/peta', ikon: 'peta', label: 'Peta' },
  { to: '/tes-harian', ikon: 'tes', label: 'Tes' },
  { to: '/materi', ikon: 'materi', label: 'Materi' },
  { to: '/lab', ikon: 'lab', label: 'Lab' },
  { to: '/leaderboard', ikon: 'skor', label: 'Papan Skor' },
]
const MENU_DOSEN = [
  { to: '/dosen', ikon: 'dasbor', label: 'Dashboard', exact: true },
  { to: '/dosen/soal', ikon: 'soal', label: 'Kelola Soal' },
  { to: '/dosen/tes', ikon: 'jadwal', label: 'Kelola Tes' },
  { to: '/dosen/materi', ikon: 'unggah', label: 'Kelola Materi' },
  { to: '/dosen/mahasiswa', ikon: 'mahasiswa', label: 'Mahasiswa' },
]

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

  const aktif = (m) =>
    m.exact ? loc.pathname === m.to : loc.pathname.startsWith(m.to)

  const menu = user?.role === 'dosen' ? MENU_DOSEN : MENU_MAHASISWA

  const chip = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'var(--bg-soft)', border: '1px solid var(--border-soft)',
    borderRadius: 999, padding: '.3rem .65rem', fontSize: '.84rem',
    fontWeight: 600, whiteSpace: 'nowrap',
  }
  const iconBtn = {
    display: 'grid', placeItems: 'center', width: 36, height: 36,
    padding: 0, borderRadius: 10,
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'color-mix(in srgb, var(--card) 88%, transparent)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
             style={{ maxWidth: 1180, margin: '0 auto', padding: '.7rem 1rem' }}>

          {/* Kiri: logo + kelas aktif */}
          <div className="flex items-center gap-3">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Logo size={30} />
            </Link>
            {kelasAktif && (
              <Link to="/profil" title="Ganti kelas"
                    style={{ ...chip, color: 'var(--text)', textDecoration: 'none' }}>
                <Icon name="kelas" size={15} style={{ color: 'var(--primary)' }} />
                {kelasAktif.matkul}
              </Link>
            )}
          </div>

          {/* Tengah: menu (baru muncul setelah masuk kelas) */}
          <nav className="flex flex-wrap items-center justify-center" style={{ gap: '.15rem' }}>
            {kelasAktif && menu.map((m) => (
              <Link key={m.to} to={m.to}
                    className={'nav-link' + (aktif(m) ? ' active' : '')}>
                <Icon name={m.ikon} size={16} />
                <span>{m.label}</span>
              </Link>
            ))}
            <Link to="/profil"
                  className={'nav-link' + (loc.pathname === '/profil' ? ' active' : '')}
                  style={!kelasAktif ? { color: 'var(--text)', fontWeight: 700 } : undefined}>
              <Icon name={kelasAktif ? 'profil' : 'kelas'} size={16} />
              <span>{kelasAktif ? 'Profil' : 'Pilih Kelas'}</span>
            </Link>
          </nav>

          {/* Kanan: statistik + aksi */}
          <div className="flex items-center gap-2">
            {stats && (
              <div className="flex items-center gap-2" style={{ marginRight: '.15rem' }}>
                <span style={{ ...chip, color: 'var(--gold)' }} title="Koin">
                  <Icon name="koin" size={14} /> {stats.koin}
                </span>
                <span style={{ ...chip, color: 'var(--gold)' }} title="Bintang">
                  <Icon name="bintang" size={14} /> {stats.total_stars}
                </span>
                <span style={{ ...chip, color: 'var(--primary)' }} title="Level pemain">
                  <Icon name="kilat" size={14} /> Lv {stats.player_level}
                </span>
              </div>
            )}
            <button className="btn btn-ghost" onClick={toggleTheme}
                    title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'} style={iconBtn}>
              <Icon name={theme === 'dark' ? 'terang' : 'gelap'} size={17} />
            </button>
            <button className="btn btn-ghost" onClick={() => { logout(); nav('/login') }}
                    title="Keluar" style={iconBtn}>
              <Icon name="keluar" size={17} />
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.6rem 1rem 3rem' }}>
        <Outlet />
      </main>
    </div>
  )
}
