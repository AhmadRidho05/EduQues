import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import Icon from '../components/Icon'

const STATUS = {
  belum_dibuka: { txt: 'Belum dibuka', c: 'var(--subtext)', ico: 'kunci' },
  berlangsung: { txt: 'Sedang dibuka', c: 'var(--success)', ico: 'waktu' },
  ditutup: { txt: 'Ditutup', c: 'var(--danger)', ico: 'silang' },
}

export default function TesHarian() {
  const [tes, setTes] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')
  const nav = useNavigate()

  function muat() {
    setMemuat(true)
    setError('')
    client.get('/tes')
      .then((r) => setTes(r.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Gagal memuat tes.'))
      .finally(() => setMemuat(false))
  }

  useEffect(() => { muat() }, [])

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
        <span className="stat-ico" style={{ color: 'var(--primary)' }}>
          <Icon name="tes" size={22} />
        </span>
        <div>
          <h1 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800 }}>
            <span className="grad-text">Tes Harian</span>
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Tes hanya bisa dikerjakan pada waktu yang dijadwalkan dosen, dan dinilai.
          </p>
        </div>
      </div>

      {memuat ? (
        <div style={{ display: 'grid', gap: '.9rem', marginTop: '1.2rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card" style={{ padding: '1.1rem 1.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '42%', marginBottom: 9 }} />
                  <div className="skeleton" style={{ height: 10, width: '62%', marginBottom: 9 }} />
                  <div className="skeleton" style={{ height: 22, width: 128, borderRadius: 999 }} />
                </div>
                <div className="skeleton" style={{ width: 74, height: 44, borderRadius: 14 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card card-accent" style={{ padding: '1.4rem', marginTop: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--danger)', fontWeight: 600 }}>
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '.8rem' }} onClick={muat}>
            <Icon name="ulang" size={15} /> Coba lagi
          </button>
        </div>
      ) : tes.length === 0 ? (
        <div className="empty" style={{ marginTop: '1.2rem' }}>
          <div className="empty-ico" style={{ color: 'var(--primary)' }}>
            <Icon name="jadwal" size={28} />
          </div>
          <div style={{ fontWeight: 700 }}>Belum ada tes di kelas ini</div>
          <p className="muted" style={{ margin: '.3rem 0 0', fontSize: '.88rem' }}>
            Jadwal tes dari dosen akan tampil di sini.
          </p>
        </div>
      ) : null}

      <div className="stagger" style={{ display: 'grid', gap: '.9rem', marginTop: '1.2rem' }}>
        {tes.map((t) => {
          const st = STATUS[t.status] || STATUS.ditutup
          return (
            <div key={t.id} className="card card-hover"
                 style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.3 }}>{t.judul}</div>

                <div className="muted"
                     style={{ display: 'flex', alignItems: 'center', gap: '.85rem',
                              flexWrap: 'wrap', fontSize: '.79rem', marginTop: '.35rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.28rem' }}>
                    <Icon name="soal" size={13} /> {t.jumlah_soal} soal
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.28rem' }}>
                    <Icon name="jadwal" size={13} /> {t.mulai} → {t.selesai}
                  </span>
                </div>

                <span className="pill"
                      style={{ marginTop: '.55rem', color: st.c, fontWeight: 600,
                               borderColor: `color-mix(in srgb, ${st.c} 38%, var(--border-soft))`,
                               background: `color-mix(in srgb, ${st.c} 12%, transparent)` }}>
                  <Icon name={st.ico} size={14} /> {st.txt}
                </span>
              </div>

              <div style={{ flexShrink: 0 }}>
                {t.dikerjakan ? (
                  <div style={{ textAlign: 'center', minWidth: 88, padding: '.6rem .9rem',
                                borderRadius: 'var(--r-md)',
                                background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--primary) 34%, transparent)' }}>
                    <div style={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1,
                                  color: 'var(--primary)' }}>{t.nilai}</div>
                    <div className="muted" style={{ fontSize: '.72rem', marginTop: 4 }}>nilai kamu</div>
                  </div>
                ) : t.bisa_kerjakan ? (
                  <button className="btn btn-primary" onClick={() => nav(`/tes-harian/${t.id}`)}>
                    Kerjakan <Icon name="kanan" size={16} />
                  </button>
                ) : (
                  <span className="muted"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.85rem' }}>
                    <Icon name={t.status === 'belum_dibuka' ? 'kunci' : 'waktu'} size={15} />
                    {t.status === 'belum_dibuka' ? 'Belum waktunya' : 'Sudah lewat'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
