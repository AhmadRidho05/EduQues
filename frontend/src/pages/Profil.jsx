import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function Profil() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [badges, setBadges] = useState([])

  useEffect(() => {
    client.get('/me/stats').then((r) => setStats(r.data)).catch(() => {})
    client.get('/badges').then((r) => setBadges(r.data)).catch(() => {})
  }, [])

  if (!stats) return <p className="muted">Memuat…</p>

  const pct = Math.min(100, Math.round((stats.xp_in_level / stats.xp_need) * 100))
  const jumlahDidapat = badges.filter((b) => b.earned).length

  const chip = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '.8rem 1rem', borderRadius: 12, background: 'var(--bg)',
    border: '1px solid var(--border)', flex: 1,
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>👤 Profil</h1>

      {/* Kartu identitas + XP */}
      <div className="card" style={{ padding: '1.6rem', marginTop: '1rem' }}>
        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'var(--primary)',
            display: 'grid', placeItems: 'center', fontSize: '1.8rem', color: '#fff',
          }}>
            {(stats.nama || 'P')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{stats.nama}</div>
            <div className="muted" style={{ fontSize: '.9rem' }}>{stats.rank}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>Lv {stats.player_level}</div>
            <div className="muted" style={{ fontSize: '.8rem' }}>Level pemain</div>
          </div>
        </div>

        {/* XP progress bar */}
        <div style={{ marginTop: '1.2rem' }}>
          <div className="flex justify-between" style={{ fontSize: '.82rem', marginBottom: 4 }}>
            <span className="muted">XP menuju level berikutnya</span>
            <span className="muted">{stats.xp_in_level} / {stats.xp_need}</span>
          </div>
          <div style={{ height: 12, background: 'var(--bg)', borderRadius: 999,
                        border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)',
                          transition: 'width .4s' }} />
          </div>
        </div>

        {/* Statistik ringkas */}
        <div className="flex gap-3" style={{ marginTop: '1.2rem' }}>
          <div style={chip}>
            <span style={{ fontSize: '1.3rem' }}>🪙</span>
            <b>{stats.koin}</b><span className="muted" style={{ fontSize: '.78rem' }}>Koin</span>
          </div>
          <div style={chip}>
            <span style={{ fontSize: '1.3rem' }}>⭐</span>
            <b>{stats.total_stars}</b><span className="muted" style={{ fontSize: '.78rem' }}>Bintang</span>
          </div>
          <div style={chip}>
            <span style={{ fontSize: '1.3rem' }}>🎖️</span>
            <b>{jumlahDidapat}/{badges.length}</b><span className="muted" style={{ fontSize: '.78rem' }}>Lencana</span>
          </div>
          <div style={chip}>
            <span style={{ fontSize: '1.3rem' }}>⚡</span>
            <b>{stats.xp}</b><span className="muted" style={{ fontSize: '.78rem' }}>Total XP</span>
          </div>
        </div>
      </div>

      {/* Koleksi lencana */}
      <h2 style={{ fontSize: '1.2rem', marginTop: '1.8rem' }}>🎖️ Koleksi Lencana</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '.9rem', marginTop: '.8rem' }}>
        {badges.map((b) => (
          <div key={b.key} className="card" style={{
            padding: '1rem', display: 'flex', gap: '.8rem', alignItems: 'center',
            opacity: b.earned ? 1 : 0.5,
            borderColor: b.earned ? 'var(--gold)' : 'var(--border)',
          }}>
            <div style={{ fontSize: '2rem', filter: b.earned ? 'none' : 'grayscale(1)' }}>
              {b.earned ? b.emoji : '🔒'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{b.nama}</div>
              <div className="muted" style={{ fontSize: '.78rem' }}>{b.syarat}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
