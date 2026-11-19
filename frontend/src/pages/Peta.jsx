import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import Icon from '../components/Icon'

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

function Legenda({ warna, teks }) {
  return (
    <span className="pill" style={{ fontSize: '.76rem' }}>
      <i style={{ width: 9, height: 9, borderRadius: '50%', background: warna,
                  display: 'inline-block' }} />
      {teks}
    </span>
  )
}

export default function Peta() {
  const [levels, setLevels] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [err, setErr] = useState('')
  const nav = useNavigate()

  function muat() {
    setMemuat(true); setErr('')
    client.get('/levels')
      .then((r) => setLevels(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || 'Gagal memuat peta. Pastikan server backend nyala.'))
      .finally(() => setMemuat(false))
  }
  useEffect(() => { muat() }, [])

  const selesai = levels.filter((l) => l.stars > 0).length
  const totalBintang = levels.reduce((a, l) => a + (l.stars || 0), 0)
  const maxBintang = levels.length * 3
  const persen = levels.length ? Math.round((selesai / levels.length) * 100) : 0

  return (
    <div className="fade-in">
      {/* Kepala + ringkasan progres */}
      <div className="card card-accent" style={{ padding: '1.4rem 1.5rem' }}>
        <div className="flex items-center justify-between gap-4" style={{ flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.55rem', margin: 0 }}>
              <span className="grad-text">Peta Petualangan</span>
            </h1>
            <p className="muted" style={{ margin: '.25rem 0 0', fontSize: '.9rem' }}>
              Klik bab yang terbuka untuk mulai. Bab berikutnya kebuka setelah bab
              sebelumnya kamu selesaikan.
            </p>
          </div>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <span className="pill"><Icon name="cek" size={13} /> {selesai}/{levels.length} bab</span>
            <span className="pill" style={{ color: 'var(--gold)' }}>
              <Icon name="bintang" size={13} /> {totalBintang}/{maxBintang}
            </span>
          </div>
        </div>
        {levels.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div className="flex justify-between" style={{ fontSize: '.78rem', marginBottom: 5 }}>
              <span className="muted">Kemajuan petualangan</span>
              <span className="muted"><b style={{ color: 'var(--text)' }}>{persen}%</b></span>
            </div>
            <div className="bar"><i style={{ width: `${persen}%` }} /></div>
          </div>
        )}
      </div>

      {memuat && <div className="skeleton" style={{ height: 540, marginTop: '1rem' }} />}

      {!memuat && err && (
        <div className="card" style={{ padding: '1.8rem', marginTop: '1rem', textAlign: 'center' }}>
          <div className="empty-ico" style={{ color: 'var(--danger)' }}><Icon name="info" size={24} /></div>
          <p style={{ color: 'var(--danger)', margin: '0 0 .9rem' }}>{err}</p>
          <button className="btn btn-primary btn-sm" onClick={muat}>
            <Icon name="ulang" size={15} /> Coba lagi
          </button>
        </div>
      )}

      {!memuat && !err && levels.length === 0 && (
        <div className="empty" style={{ marginTop: '1rem' }}>
          <div className="empty-ico anim-float"><Icon name="peta" size={26} /></div>
          <p style={{ margin: '0 0 .2rem', fontWeight: 700 }}>Peta masih kosong</p>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Kelas ini belum punya bab. Hubungi dosenmu ya.
          </p>
        </div>
      )}

      {!memuat && !err && levels.length > 0 && (
        <>
          <div className="card" style={{
            position: 'relative', height: 560, marginTop: '1rem', overflow: 'hidden',
            background: 'radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 55%),' +
                        'radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 55%),' +
                        'var(--card)',
          }}>
            {/* Jalur berkelok penghubung antar bab */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
                 style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <polyline
                points={MAP_POS.slice(0, levels.length).map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="1.5 1.5" />
            </svg>

            {levels.map((lv, i) => {
              const [x, y] = MAP_POS[i] || [50, 50]
              const clickable = lv.unlocked
              const playable = lv.unlocked && lv.stars === 0 && !lv.is_boss
              const warna = nodeColor(lv)
              return (
                <button
                  key={lv.id}
                  onClick={() => clickable && nav(`/level/${lv.id}`)}
                  disabled={!clickable}
                  title={lv.unlocked ? lv.nama : 'Masih terkunci'}
                  style={{
                    position: 'absolute', left: `${x}%`, top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 78, height: 78, borderRadius: '50%',
                    border: `3px solid ${warna}`,
                    background: lv.unlocked
                      ? `linear-gradient(150deg, color-mix(in srgb, ${warna} 16%, var(--card)), var(--card))`
                      : 'var(--card)',
                    cursor: clickable ? 'pointer' : 'not-allowed',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: clickable ? `0 0 0 4px color-mix(in srgb, ${warna} 20%, transparent)` : 'none',
                    opacity: lv.unlocked ? 1 : 0.55,
                    animation: playable ? 'nodePulse 2.2s ease infinite' : undefined,
                    transition: 'transform .18s ease',
                  }}
                  onMouseEnter={(e) => { if (clickable) e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%)' }}
                >
                  <span style={{ fontSize: '1.55rem', lineHeight: 1 }}>
                    {lv.unlocked ? lv.emoji : '🔒'}
                  </span>
                  <span style={{ fontSize: '.6rem', color: 'var(--subtext)', marginTop: 3,
                                 fontWeight: 600 }}>
                    Bab {lv.urutan}
                  </span>
                  {lv.unlocked && lv.stars > 0 && (
                    <span style={{ position: 'absolute', bottom: -19, fontSize: '.72rem',
                                   color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                      {'⭐'.repeat(lv.stars)}
                    </span>
                  )}
                  {lv.is_boss && lv.unlocked && (
                    <span className="pill" style={{
                      position: 'absolute', top: -13, fontSize: '.6rem', padding: '.05rem .4rem',
                      color: 'var(--danger)', fontWeight: 700,
                      borderColor: 'color-mix(in srgb, var(--danger) 45%, var(--border))',
                      background: 'var(--card)',
                    }}>BOSS</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex gap-2" style={{ marginTop: '1rem', flexWrap: 'wrap' }}>
            <Legenda warna="var(--primary)" teks="Bisa dimainkan" />
            <Legenda warna="var(--success)" teks="Selesai" />
            <Legenda warna="var(--danger)" teks="Boss" />
            <Legenda warna="var(--border)" teks="Terkunci" />
          </div>
        </>
      )}
    </div>
  )
}
