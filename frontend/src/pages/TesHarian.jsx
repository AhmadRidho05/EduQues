import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

const STATUS = {
  belum_dibuka: { txt: '🔒 Belum dibuka', c: 'var(--subtext)' },
  berlangsung: { txt: '🟢 Sedang dibuka', c: 'var(--success)' },
  ditutup: { txt: '⛔ Ditutup', c: 'var(--danger)' },
}

export default function TesHarian() {
  const [tes, setTes] = useState([])
  const nav = useNavigate()

  useEffect(() => { client.get('/tes').then((r) => setTes(r.data)).catch(() => {}) }, [])

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>📝 Tes Harian</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Tes hanya bisa dikerjakan pada waktu yang dijadwalkan dosen, dan dinilai.
      </p>

      {tes.length === 0 && <p className="muted">Belum ada tes di kelas ini.</p>}

      <div style={{ display: 'grid', gap: '.9rem', marginTop: '.6rem' }}>
        {tes.map((t) => {
          const st = STATUS[t.status] || STATUS.ditutup
          return (
            <div key={t.id} className="card flex items-center justify-between"
                 style={{ padding: '1.1rem 1.3rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{t.judul}</div>
                <div className="muted" style={{ fontSize: '.8rem' }}>
                  {t.jumlah_soal} soal · {t.mulai} → {t.selesai}
                </div>
                <div style={{ fontSize: '.82rem', color: st.c, marginTop: 2 }}>{st.txt}</div>
              </div>
              <div>
                {t.dikerjakan ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{t.nilai}</div>
                    <div className="muted" style={{ fontSize: '.75rem' }}>nilai kamu</div>
                  </div>
                ) : t.bisa_kerjakan ? (
                  <button className="btn btn-primary" onClick={() => nav(`/tes-harian/${t.id}`)}>
                    Kerjakan →
                  </button>
                ) : (
                  <span className="muted" style={{ fontSize: '.85rem' }}>
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
