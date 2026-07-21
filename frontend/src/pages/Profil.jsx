import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import KelasSection from '../components/KelasSection'
import Icon from '../components/Icon'

/** Cincin kemajuan XP (SVG murni, tanpa pustaka chart). */
function Ring({ persen, ukuran = 108, tebal = 9, isi }) {
  const r = (ukuran - tebal) / 2
  const keliling = 2 * Math.PI * r
  const isiKeliling = keliling * (1 - Math.min(1, Math.max(0, persen / 100)))
  return (
    <div style={{ position: 'relative', width: ukuran, height: ukuran, flexShrink: 0 }}>
      <svg width={ukuran} height={ukuran} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="55%" stopColor="#7C6BFF" />
            <stop offset="100%" stopColor="#26D6EE" />
          </linearGradient>
        </defs>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none"
                stroke="var(--bg-soft)" strokeWidth={tebal} />
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none"
                stroke="url(#ringGrad)" strokeWidth={tebal} strokeLinecap="round"
                strokeDasharray={keliling} strokeDashoffset={isiKeliling}
                style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                    textAlign: 'center', lineHeight: 1.15 }}>
        {isi}
      </div>
    </div>
  )
}

export default function Profil() {
  const { user } = useAuth()
  const mahasiswa = user?.role === 'mahasiswa'
  const [stats, setStats] = useState(null)
  const [badges, setBadges] = useState([])
  // Pesan kalau user tadi ditolak masuk menu karena belum pilih kelas.
  const [hint, setHint] = useState('')

  useEffect(() => {
    const h = sessionStorage.getItem('kelasHint')
    if (h) { setHint(h); sessionStorage.removeItem('kelasHint') }
  }, [])

  useEffect(() => {
    if (!mahasiswa) return
    client.get('/me/stats').then((r) => setStats(r.data)).catch(() => {})
    client.get('/badges').then((r) => setBadges(r.data)).catch(() => {})
  }, [mahasiswa])

  const pct = stats && stats.xp_need > 0
    ? Math.min(100, Math.round((stats.xp_in_level / stats.xp_need) * 100)) : 0
  const dapat = badges.filter((b) => b.earned).length
  const pctLencana = badges.length ? Math.round((dapat / badges.length) * 100) : 0
  const inisial = (user?.nama || 'P')[0].toUpperCase()

  const Stat = ({ ikon, angka, label, warna }) => (
    <div className="stat" style={{ flex: '1 1 130px', padding: '.95rem 1rem' }}>
      <span className="stat-ico" style={{
        width: 34, height: 34, borderRadius: 10, marginBottom: '.5rem',
        background: `color-mix(in srgb, ${warna} 16%, transparent)`,
        borderColor: `color-mix(in srgb, ${warna} 32%, transparent)`, color: warna,
      }}>
        <Icon name={ikon} size={17} />
      </span>
      <div className="stat-num" style={{ fontSize: '1.45rem' }}>{angka}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  )

  return (
    <div className="fade-in">
      {hint && (
        <div className="card" style={{
          padding: '.8rem 1rem', marginBottom: '1rem',
          borderColor: 'color-mix(in srgb, var(--info) 45%, var(--border))',
          background: 'color-mix(in srgb, var(--info) 12%, var(--card))',
          display: 'flex', alignItems: 'center', gap: '.7rem',
        }}>
          <span style={{ color: 'var(--info)', display: 'flex' }}><Icon name="info" size={19} /></span>
          <span style={{ fontSize: '.92rem' }}>{hint}</span>
          <button onClick={() => setHint('')} className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto', padding: '.2rem .45rem' }} title="Tutup">
            <Icon name="silang" size={14} />
          </button>
        </div>
      )}

      {/* ===== Kartu identitas ===== */}
      <div className="card card-accent" style={{ padding: '1.6rem', overflow: 'hidden' }}>
        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
          {/* Avatar dengan cincin gradien */}
          <div style={{
            width: 74, height: 74, borderRadius: '50%', padding: 3,
            background: 'var(--grad-brand)', flexShrink: 0,
            boxShadow: 'var(--sh-glow)',
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: 'var(--card)', display: 'grid', placeItems: 'center',
              fontSize: '1.8rem', fontWeight: 800,
            }}>
              <span className="grad-text">{inisial}</span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 190 }}>
            <div style={{ fontWeight: 800, fontSize: '1.35rem', lineHeight: 1.2 }}>{user?.nama}</div>
            <div className="muted" style={{ fontSize: '.88rem', marginTop: 2 }}>{user?.email}</div>
            <div className="flex items-center gap-2" style={{ marginTop: '.6rem', flexWrap: 'wrap' }}>
              <span className="pill pill-accent">
                <Icon name={mahasiswa ? 'kelas' : 'dasbor'} size={14} />
                {mahasiswa ? 'Mahasiswa' : 'Dosen'}
              </span>
              {mahasiswa && stats && (
                <>
                  <span className="pill"><Icon name="kilat" size={13} /> Lv {stats.player_level}</span>
                  <span className="pill" style={{ color: 'var(--gold)' }}>{stats.rank}</span>
                </>
              )}
            </div>
          </div>

          {/* Cincin XP (khusus mahasiswa) */}
          {mahasiswa && stats && (
            <Ring persen={pct} isi={
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{pct}%</div>
                <div className="muted" style={{ fontSize: '.68rem' }}>menuju Lv {stats.player_level + 1}</div>
              </div>
            } />
          )}
        </div>

        {mahasiswa && stats && (
          <div style={{ marginTop: '1.2rem' }}>
            <div className="flex justify-between" style={{ fontSize: '.8rem', marginBottom: 5 }}>
              <span className="muted">XP menuju level berikutnya</span>
              <span className="muted"><b style={{ color: 'var(--text)' }}>{stats.xp_in_level}</b> / {stats.xp_need}</span>
            </div>
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}
      </div>

      {/* ===== Statistik ===== */}
      {mahasiswa && stats && (
        <div className="flex gap-3 stagger" style={{ flexWrap: 'wrap', marginTop: '1rem' }}>
          <Stat ikon="koin" angka={stats.koin} label="Koin" warna="var(--gold)" />
          <Stat ikon="bintang" angka={stats.total_stars} label="Bintang" warna="var(--gold)" />
          <Stat ikon="lencana" angka={`${dapat}/${badges.length}`} label="Lencana" warna="var(--accent)" />
          <Stat ikon="kilat" angka={stats.xp} label="Total XP" warna="var(--primary)" />
        </div>
      )}

      {/* ===== Kelas ===== */}
      <div style={{ marginTop: '1.8rem' }}>
        <KelasSection />
      </div>

      {/* ===== Lencana ===== */}
      {mahasiswa && badges.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
            <h2 className="section-title">Koleksi Lencana</h2>
            <span className="muted" style={{ fontSize: '.84rem' }}>{dapat} dari {badges.length} terkumpul</span>
          </div>
          <div className="bar bar-gold bar-sm" style={{ margin: '.6rem 0 1rem' }}>
            <i style={{ width: `${pctLencana}%` }} />
          </div>

          <div className="stagger" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '.8rem',
          }}>
            {badges.map((b) => (
              <div key={b.key} className={'card' + (b.earned ? ' card-hover' : '')} style={{
                padding: '1rem', display: 'flex', gap: '.85rem', alignItems: 'center',
                borderColor: b.earned
                  ? 'color-mix(in srgb, var(--gold) 45%, var(--border))' : 'var(--border)',
                background: b.earned
                  ? 'linear-gradient(135deg, color-mix(in srgb, var(--gold) 9%, var(--card)), var(--card))'
                  : 'var(--card)',
                opacity: b.earned ? 1 : .62,
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                  display: 'grid', placeItems: 'center', fontSize: '1.5rem',
                  background: b.earned
                    ? 'color-mix(in srgb, var(--gold) 16%, transparent)' : 'var(--bg-soft)',
                  border: `1px solid ${b.earned
                    ? 'color-mix(in srgb, var(--gold) 35%, transparent)' : 'var(--border-soft)'}`,
                  filter: b.earned ? 'none' : 'grayscale(1)',
                }}>
                  {b.earned ? b.emoji : <Icon name="kunci" size={19} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.92rem' }}>{b.nama}</div>
                  <div className="muted" style={{ fontSize: '.77rem', lineHeight: 1.35 }}>{b.syarat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
