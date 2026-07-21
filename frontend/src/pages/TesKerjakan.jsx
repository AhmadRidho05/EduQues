import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { burstConfetti } from '../confetti'
import Icon from '../components/Icon'

export default function TesKerjakan() {
  const { id } = useParams()
  const nav = useNavigate()

  const [data, setData] = useState(null)      // {judul, idx, total, questions}
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)  // respons /jawab
  const [hasil, setHasil] = useState(null)    // hasil akhir
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const mulai = useRef(false)  // cegah dobel-panggil (React StrictMode)

  useEffect(() => {
    if (mulai.current) return
    mulai.current = true
    client.post(`/tes/${id}/mulai`)
      .then((r) => { setData(r.data); setIdx(r.data.idx) })
      .catch((e) => setErr(e?.response?.data?.detail || 'Gagal memulai tes.'))
  }, [id])

  const soal = data?.questions?.[idx]

  async function jawab(val) {
    if (feedback || busy) return
    setBusy(true)
    try {
      const { data: res } = await client.post(`/tes/${id}/jawab`, { jawaban: String(val) })
      setFeedback(res)
      if (res.status === 'selesai') { setHasil(res); burstConfetti() }
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Gagal mengirim jawaban.')
    } finally { setBusy(false) }
  }

  function lanjut() {
    const fb = feedback
    setFeedback(null); setAnswer('')
    if (fb.status !== 'selesai') setIdx(fb.idx)
  }

  // ---- Error fatal ----
  if (err) return (
    <div className="card card-accent fade-in" style={{ maxWidth: 460, margin: '2rem auto', padding: '2.2rem 1.8rem', textAlign: 'center' }}>
      <div className="empty-ico" style={{ color: 'var(--danger)' }}><Icon name="info" size={28} /></div>
      <h2 className="grad-text" style={{ margin: '0 0 .3rem', fontSize: '1.3rem' }}>Terjadi Masalah</h2>
      <p className="muted" style={{ margin: '0 0 1.4rem' }}>{err}</p>
      <button className="btn btn-primary" onClick={() => nav('/tes-harian')}>
        <Icon name="kiri" size={16} /> Kembali ke Daftar Tes
      </button>
    </div>
  )

  // ---- Memuat ----
  if (!data) return (
    <div className="fade-in">
      <div className="card" style={{ padding: '1.2rem 1.4rem', marginBottom: '1rem' }}>
        <div className="flex items-center justify-between" style={{ gap: '.8rem' }}>
          <div className="skeleton" style={{ height: 20, width: '45%' }} />
          <div className="skeleton" style={{ height: 26, width: 120, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ height: 10, width: '100%', marginTop: '1rem', borderRadius: 999 }} />
      </div>
      <div className="card" style={{ padding: '1.6rem' }}>
        <div className="skeleton" style={{ height: 24, width: '70%' }} />
        <div className="skeleton" style={{ height: 96, width: '100%', marginTop: '1rem' }} />
        <div className="flex" style={{ flexDirection: 'column', gap: '.6rem', marginTop: '1.4rem' }}>
          <div className="skeleton" style={{ height: 44, width: '100%' }} />
          <div className="skeleton" style={{ height: 44, width: '100%' }} />
          <div className="skeleton" style={{ height: 44, width: '100%' }} />
        </div>
      </div>
    </div>
  )

  // ---- Hasil akhir ----
  if (hasil) {
    const pct = hasil.total ? Math.round((hasil.benar_count / hasil.total) * 100) : 0
    return (
      <div className="card card-accent fade-in" style={{ maxWidth: 460, margin: '2rem auto', padding: '2.4rem 1.8rem', textAlign: 'center' }}>
        <div className="empty-ico anim-pop" style={{ fontSize: '2rem' }}>🎯</div>
        <h1 style={{ margin: '0 0 .2rem', fontSize: '1.5rem' }}>Tes Selesai!</h1>
        <div className="grad-text" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, margin: '.4rem 0' }}>
          {hasil.nilai}
        </div>
        <p className="muted" style={{ margin: '0 0 1.1rem' }}>
          Benar {hasil.benar_count} dari {hasil.total} soal
        </p>
        <div className="bar bar-success" style={{ maxWidth: 260, margin: '0 auto 1.6rem' }}>
          <i style={{ width: `${pct}%` }} />
        </div>
        <button className="btn btn-primary" onClick={() => nav('/tes-harian')}>
          <Icon name="kiri" size={16} /> Kembali ke Daftar Tes
        </button>
      </div>
    )
  }

  // ---- Mengerjakan ----
  const progres = data.total ? (idx / data.total) * 100 : 0
  return (
    <div>
      {/* Header pengerjaan */}
      <div className="card" style={{ padding: '1.2rem 1.4rem', marginBottom: '1rem' }}>
        <div className="flex items-center justify-between" style={{ gap: '.8rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', minWidth: 0 }}>
            <span className="stat-ico" style={{ width: 36, height: 36, fontSize: '1rem', color: 'var(--primary)' }}>
              <Icon name="tes" size={18} />
            </span>
            <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {data.judul}
            </span>
          </div>
          <span className="pill pill-accent">Soal {idx + 1} dari {data.total}</span>
        </div>
        <div className="bar" style={{ marginTop: '1rem' }}>
          <i style={{ width: `${progres}%` }} />
        </div>
      </div>

      {/* Kartu soal */}
      <div key={idx} className="card fade-in" style={{ padding: '1.6rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.5 }}>
          {soal.q}
        </h2>
        {soal.code && <pre className="code" style={{ margin: '1rem 0' }}>{soal.code}</pre>}

        {soal.tipe === 'mc' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '.6rem', marginTop: '1rem' }}>
            {soal.opts.map((opt) => {
              const dipilih = feedback && opt === answer
              const tone = dipilih ? (feedback.benar ? 'var(--success)' : 'var(--danger)') : null
              return (
                <button key={opt} className="btn btn-ghost"
                        style={{
                          textAlign: 'left', justifyContent: 'flex-start', width: '100%',
                          ...(tone ? {
                            borderColor: tone, color: tone,
                            background: `color-mix(in srgb, ${tone} 10%, transparent)`,
                          } : {}),
                        }}
                        disabled={!!feedback || busy}
                        onClick={() => { setAnswer(opt); jawab(opt) }}>
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {(soal.tipe === 'out' || soal.tipe === 'blank') && (
          <form onSubmit={(e) => { e.preventDefault(); if (!feedback && answer.trim()) jawab(answer) }}
                style={{ marginTop: '1rem' }}>
            <input className="input" value={answer} disabled={!!feedback} autoFocus
                   placeholder="Ketik jawabanmu…" onChange={(e) => setAnswer(e.target.value)} />
            {!feedback && (
              <button className="btn btn-primary" style={{ marginTop: '.8rem' }}
                      disabled={!answer.trim() || busy}>
                <Icon name="cek" size={16} /> Jawab
              </button>
            )}
          </form>
        )}

        {feedback && (
          <div style={{ marginTop: '1.2rem' }}>
            <p className={feedback.benar ? 'anim-pop' : 'anim-shake'}
               style={{
                 display: 'flex', alignItems: 'center', gap: '.4rem', fontWeight: 700,
                 margin: '0 0 .9rem', color: feedback.benar ? 'var(--success)' : 'var(--danger)',
               }}>
              <Icon name={feedback.benar ? 'cek' : 'silang'} size={18} />
              {feedback.benar ? 'Benar' : 'Salah'}
            </p>
            <button className="btn btn-primary" onClick={lanjut}>
              {feedback.status === 'selesai' ? 'Lihat Nilai' : 'Lanjut'}
              <Icon name="kanan" size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Peringatan permanen */}
      <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem', marginTop: '1rem' }}>
        <Icon name="info" size={14} />
        Tes dinilai. Jawaban tidak bisa diubah setelah dikirim.
      </p>
    </div>
  )
}
