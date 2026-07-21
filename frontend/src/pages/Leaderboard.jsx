import { useEffect, useState } from 'react'
import client from '../api/client'
import Icon from '../components/Icon'

const MEDALI = ['🥇', '🥈', '🥉']
const WARNA_PODIUM = ['var(--gold)', '#C0C6D4', '#CD7F32']

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')

  function muat() {
    setMemuat(true)
    setError('')
    client.get('/leaderboard')
      .then((r) => setRows(r.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Gagal memuat papan skor.'))
      .finally(() => setMemuat(false))
  }

  useEffect(() => { muat() }, [])

  const xpTertinggi = Math.max(1, ...rows.map((r) => r.xp || 0))
  const podium = rows.slice(0, 3)
  const sisanya = rows.slice(3)

  const Avatar = ({ nama, size = 38 }) => (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800,
      fontSize: size * 0.4, background: 'var(--grad-brand)',
    }}>{(nama || '?')[0].toUpperCase()}</span>
  )

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>
            <span className="grad-text">Papan Skor</span>
          </h1>
          <p className="muted" style={{ margin: '.2rem 0 0', fontSize: '.9rem' }}>
            Peringkat mahasiswa di kelas ini berdasarkan XP.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={muat} title="Muat ulang">
          <Icon name="ulang" size={15} /> Muat ulang
        </button>
      </div>

      {memuat && (
        <div style={{ marginTop: '1.2rem', display: 'grid', gap: '.7rem' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: 62 }} />
          ))}
        </div>
      )}

      {!memuat && error && (
        <div className="card" style={{ padding: '1.6rem', marginTop: '1.2rem', textAlign: 'center' }}>
          <div className="empty-ico" style={{ color: 'var(--danger)' }}><Icon name="info" size={24} /></div>
          <p style={{ color: 'var(--danger)', margin: '0 0 .9rem' }}>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={muat}>
            <Icon name="ulang" size={15} /> Coba lagi
          </button>
        </div>
      )}

      {!memuat && !error && rows.length === 0 && (
        <div className="empty" style={{ marginTop: '1.2rem' }}>
          <div className="empty-ico anim-float"><Icon name="skor" size={26} /></div>
          <p style={{ margin: '0 0 .2rem', fontWeight: 700 }}>Papan skor masih kosong</p>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Belum ada mahasiswa yang menyelesaikan bab. Jadilah yang pertama!
          </p>
        </div>
      )}

      {!memuat && !error && podium.length > 0 && (
        <div className="stagger" style={{
          display: 'grid', gap: '.8rem', marginTop: '1.2rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        }}>
          {podium.map((r, i) => (
            <div key={i} className="card card-hover" style={{
              padding: '1.2rem', textAlign: 'center', position: 'relative', overflow: 'hidden',
              borderColor: `color-mix(in srgb, ${WARNA_PODIUM[i]} 45%, var(--border))`,
              background: `linear-gradient(160deg, color-mix(in srgb, ${WARNA_PODIUM[i]} 12%, var(--card)), var(--card))`,
            }}>
              <div style={{ fontSize: '1.9rem', lineHeight: 1 }}>{MEDALI[i]}</div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '.6rem 0 .5rem' }}>
                <Avatar nama={r.nama} size={50} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>{r.nama}</div>
              <div className="muted" style={{ fontSize: '.78rem', marginBottom: '.6rem' }}>{r.rank}</div>
              <div className="flex items-center justify-center gap-2" style={{ flexWrap: 'wrap' }}>
                <span className="pill" style={{ fontSize: '.76rem' }}>
                  <Icon name="kilat" size={13} /> Lv {r.player_level}
                </span>
                <span className="pill" style={{ fontSize: '.76rem', color: 'var(--gold)' }}>
                  {r.xp} XP
                </span>
              </div>
              <div className="bar bar-gold bar-sm" style={{ marginTop: '.8rem' }}>
                <i style={{ width: `${Math.round((r.xp / xpTertinggi) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!memuat && !error && sisanya.length > 0 && (
        <div className="card" style={{ marginTop: '1rem', overflow: 'hidden' }}>
          {sisanya.map((r, i) => {
            const nomor = i + 4
            return (
              <div key={nomor} className="row-hover flex items-center gap-3"
                   style={{ padding: '.8rem 1.1rem',
                            borderBottom: i < sisanya.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <span className="muted" style={{ width: 30, fontWeight: 700, fontSize: '.88rem',
                                                 flexShrink: 0 }}>#{nomor}</span>
                <Avatar nama={r.nama} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nama}</div>
                  <div className="muted" style={{ fontSize: '.76rem' }}>{r.rank}</div>
                </div>
                <div style={{ width: 90, flexShrink: 0 }}>
                  <div className="bar bar-sm"><i style={{ width: `${Math.round((r.xp / xpTertinggi) * 100)}%` }} /></div>
                </div>
                <span className="pill" style={{ fontSize: '.76rem', flexShrink: 0 }}>
                  <Icon name="kilat" size={12} /> Lv {r.player_level}
                </span>
                <span className="muted" style={{ fontSize: '.82rem', width: 66, textAlign: 'right',
                                                 flexShrink: 0 }}>{r.xp} XP</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
