import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

// Posisi node di peta (persen), di-port dari MAP_POS PyQuest.
const MAP_POS = [
  [12, 15], [36, 11], [60, 16], [84, 23], [82, 50],
  [58, 45], [34, 51], [13, 59], [30, 83], [64, 84],
]

function nodeColor(lv) {
  if (!lv.unlocked) return 'var(--border)'
  if (lv.stars > 0) return 'var(--success)'
  if (lv.is_boss) return 'var(--danger)'
  return 'var(--primary)'
}

export default function Peta() {
  const [levels, setLevels] = useState([])
  const [err, setErr] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    client.get('/levels')
      .then((r) => setLevels(r.data))
      .catch(() => setErr('Gagal memuat peta. Pastikan server backend nyala.'))
  }, [])

  return (
    <div>
      <h1 style={{ margin: '0 0 .3rem', fontSize: '1.6rem' }}>🗺️ Peta Petualangan</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Klik level yang terbuka untuk mulai. Level berikutnya kebuka setelah kamu
        menyelesaikan level sebelumnya.
      </p>

      {err && <p style={{ color: 'var(--danger)' }}>{err}</p>}

      <div className="card" style={{ position: 'relative', height: 560, marginTop: '1rem',
                                     overflow: 'hidden' }}>
        {/* Jalur berkelok penghubung antar level */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"
             style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <polyline
            points={MAP_POS.slice(0, levels.length).map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
        </svg>

        {levels.map((lv, i) => {
          const [x, y] = MAP_POS[i] || [50, 50]
          const clickable = lv.unlocked
          return (
            <button
              key={lv.id}
              onClick={() => clickable && nav(`/level/${lv.id}`)}
              disabled={!clickable}
              title={lv.unlocked ? lv.nama : 'Masih terkunci 🔒'}
              style={{
                position: 'absolute', left: `${x}%`, top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                width: 74, height: 74, borderRadius: '50%',
                border: `3px solid ${nodeColor(lv)}`,
                background: 'var(--card)',
                cursor: clickable ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: clickable ? `0 0 0 4px color-mix(in srgb, ${nodeColor(lv)} 22%, transparent)` : 'none',
                opacity: lv.unlocked ? 1 : 0.55,
              }}
            >
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                {lv.unlocked ? lv.emoji : '🔒'}
              </span>
              <span style={{ fontSize: '.62rem', color: 'var(--subtext)', marginTop: 2 }}>
                Lv {lv.urutan}
              </span>
              {lv.unlocked && (
                <span style={{ position: 'absolute', bottom: -18, fontSize: '.7rem',
                               color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                  {'⭐'.repeat(lv.stars)}{lv.stars === 0 ? '' : ''}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex gap-4 muted" style={{ marginTop: '1.4rem', fontSize: '.82rem', flexWrap: 'wrap' }}>
        <span>🟣 Bisa dimainkan</span>
        <span>🟢 Selesai</span>
        <span>🔴 Boss</span>
        <span>🔒 Terkunci</span>
      </div>
    </div>
  )
}
