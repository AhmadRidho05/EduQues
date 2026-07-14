import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const medals = ['🥇', '🥈', '🥉']

  useEffect(() => {
    client.get('/leaderboard').then((r) => setRows(r.data)).catch(() => {})
  }, [])

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>🏆 Papan Skor</h1>
      <div className="card" style={{ marginTop: '1rem', overflow: 'hidden' }}>
        {rows.length === 0 && (
          <p className="muted" style={{ padding: '1.2rem' }}>Belum ada mahasiswa yang bermain.</p>
        )}
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between"
               style={{ padding: '.85rem 1.2rem',
                        borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span>
              <span style={{ display: 'inline-block', width: 34 }}>{medals[i] || `#${i + 1}`}</span>
              <b>{r.nama}</b> <span className="muted">· {r.rank}</span>
            </span>
            <span className="muted">Lv {r.player_level} · {r.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  )
}
