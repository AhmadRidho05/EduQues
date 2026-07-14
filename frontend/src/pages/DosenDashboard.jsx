import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function DosenDashboard() {
  const { user } = useAuth()
  const [levels, setLevels] = useState([])

  useEffect(() => {
    client.get('/levels').then((r) => setLevels(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>👨‍🏫 Dashboard Dosen</h1>
      <p className="muted" style={{ marginTop: 0 }}>Halo, {user?.nama} 👋 — ini area kelola konten.</p>

      <div className="card" style={{ padding: '1.6rem', marginTop: '1rem' }}>
        <p style={{ marginTop: 0 }}>
          🚧 Fitur <b>kelola soal (CRUD)</b> dan <b>pantau nilai mahasiswa</b> akan
          dibangun di <b>Fase 7</b>.
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          Saat ini ada <b>{levels.length} level</b> di sistem
          (total {levels.reduce((s, l) => s + l.jumlah_soal, 0)} soal).
        </p>
      </div>
    </div>
  )
}
