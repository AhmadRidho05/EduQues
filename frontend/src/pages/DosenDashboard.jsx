import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function DosenDashboard() {
  const { user } = useAuth()
  const [ov, setOv] = useState(null)

  useEffect(() => {
    client.get('/dosen/overview').then((r) => setOv(r.data)).catch(() => {})
  }, [])

  if (user?.role !== 'dosen')
    return <p className="muted">Halaman ini khusus dosen.</p>

  const stat = (emoji, angka, label) => (
    <div className="card" style={{ padding: '1.2rem', flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem' }}>{emoji}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{angka ?? '–'}</div>
      <div className="muted" style={{ fontSize: '.82rem' }}>{label}</div>
    </div>
  )

  const action = (to, emoji, judul, desc) => (
    <Link to={to} className="card" style={{
      padding: '1.4rem', flex: 1, display: 'block', color: 'var(--text)',
      textDecoration: 'none',
    }}>
      <div style={{ fontSize: '1.8rem' }}>{emoji}</div>
      <div style={{ fontWeight: 700, marginTop: '.3rem' }}>{judul}</div>
      <div className="muted" style={{ fontSize: '.85rem' }}>{desc}</div>
    </Link>
  )

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>👨‍🏫 Dashboard Dosen</h1>
      <p className="muted" style={{ marginTop: 0 }}>Halo, {user?.nama} 👋</p>

      <div className="flex gap-3" style={{ marginTop: '1rem', flexWrap: 'wrap' }}>
        {stat('🎓', ov?.num_students, 'Mahasiswa')}
        {stat('🗺️', ov?.num_levels, 'Level')}
        {stat('📝', ov?.num_questions, 'Total Soal')}
      </div>

      <div className="flex gap-3" style={{ marginTop: '1.4rem', flexWrap: 'wrap' }}>
        {action('/dosen/soal', '📝', 'Kelola Soal', 'Tambah, ubah, hapus soal tiap level.')}
        {action('/dosen/mahasiswa', '📊', 'Pantau Mahasiswa', 'Lihat progres & nilai mahasiswa.')}
      </div>
    </div>
  )
}
