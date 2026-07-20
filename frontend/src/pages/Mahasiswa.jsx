import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Mahasiswa() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    client.get('/dosen/students').then((r) => setStudents(r.data)).catch(() => {})
  }, [])

  function lihat(id) {
    client.get(`/dosen/students/${id}`).then((r) => setDetail(r.data)).catch(() => {})
  }

  if (user?.role !== 'dosen')
    return <p className="muted">Halaman ini khusus dosen.</p>

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>📊 Pantau Mahasiswa</h1>

      {students.length === 0 && (
        <p className="muted">Belum ada mahasiswa yang mendaftar.</p>
      )}

      <div className="card" style={{ marginTop: '1rem', overflow: 'hidden' }}>
        {students.map((s, i) => (
          <div key={s.id} className="flex items-center justify-between"
               style={{ padding: '.85rem 1.2rem',
                        borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div>
              <b>{s.nama}</b> <span className="muted">· {s.email}</span>
              <div className="muted" style={{ fontSize: '.8rem' }}>
                {s.rank} · Lv {s.player_level} · {s.levels_completed} level selesai · ⭐ {s.total_stars}
              </div>
            </div>
            <button className="btn btn-ghost" style={{ padding: '.35rem .8rem', fontSize: '.82rem' }}
                    onClick={() => lihat(s.id)}>Detail</button>
          </div>
        ))}
      </div>

      {/* Detail progres seorang mahasiswa */}
      {detail && (
        <div className="card" style={{ padding: '1.4rem', marginTop: '1.4rem' }}>
          <div className="flex items-center justify-between">
            <h3 style={{ margin: 0 }}>{detail.nama}</h3>
            <button className="btn btn-ghost" style={{ padding: '.3rem .7rem', fontSize: '.8rem' }}
                    onClick={() => setDetail(null)}>Tutup</button>
          </div>
          <p className="muted" style={{ marginTop: '.3rem' }}>
            {detail.rank} · Level pemain {detail.player_level} · {detail.xp} XP · 🪙 {detail.koin}
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '.8rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--subtext)', fontSize: '.8rem' }}>
                <th style={{ padding: '.4rem 0' }}>Level</th>
                <th>Bintang</th>
                <th>Skor terbaik</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.progress.map((p) => (
                <tr key={p.level_id} style={{ borderTop: '1px solid var(--border)', fontSize: '.9rem' }}>
                  <td style={{ padding: '.5rem 0' }}>{p.urutan}. {p.nama}</td>
                  <td style={{ color: 'var(--gold)' }}>
                    {p.stars > 0 ? '⭐'.repeat(p.stars) : '–'}
                  </td>
                  <td>{p.best_score || '–'}</td>
                  <td style={{ color: p.selesai ? 'var(--success)' : 'var(--subtext)' }}>
                    {p.selesai ? '✅ Selesai' : 'Belum'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
