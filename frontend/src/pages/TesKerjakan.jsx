import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { burstConfetti } from '../confetti'

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

  if (err) return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
      <p>{err}</p>
      <button className="btn btn-primary" onClick={() => nav('/tes-harian')}>← Daftar Tes</button>
    </div>
  )
  if (!data) return <p className="muted">Memuat tes…</p>

  // ---- Hasil akhir ----
  if (hasil) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>🎯</div>
        <h1>Tes Selesai!</h1>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', margin: '.4rem 0' }}>
          {hasil.nilai}
        </div>
        <p className="muted">Benar {hasil.benar_count} dari {hasil.total} soal</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}
                onClick={() => nav('/tes-harian')}>← Kembali ke Daftar Tes</button>
      </div>
    )
  }

  // ---- Mengerjakan ----
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <span style={{ fontWeight: 700 }}>{data.judul}</span>
        <span className="muted">Soal {idx + 1} / {data.total}</span>
      </div>

      <div className="card" style={{ padding: '1.6rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>{soal.q}</h2>
        {soal.code && <pre className="code" style={{ margin: '1rem 0' }}>{soal.code}</pre>}

        {soal.tipe === 'mc' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '.6rem', marginTop: '1rem' }}>
            {soal.opts.map((opt) => (
              <button key={opt} className="btn btn-ghost" style={{ textAlign: 'left' }}
                      disabled={!!feedback || busy}
                      onClick={() => { setAnswer(opt); jawab(opt) }}>{opt}</button>
            ))}
          </div>
        )}

        {(soal.tipe === 'out' || soal.tipe === 'blank') && (
          <form onSubmit={(e) => { e.preventDefault(); if (!feedback && answer.trim()) jawab(answer) }}
                style={{ marginTop: '1rem' }}>
            <input className="input" value={answer} disabled={!!feedback} autoFocus
                   placeholder="Ketik jawabanmu…" onChange={(e) => setAnswer(e.target.value)} />
            {!feedback && (
              <button className="btn btn-primary" style={{ marginTop: '.8rem' }}
                      disabled={!answer.trim() || busy}>Jawab</button>
            )}
          </form>
        )}

        {feedback && (
          <div style={{ marginTop: '1.2rem' }}>
            <p style={{ fontWeight: 700, color: feedback.benar ? 'var(--success)' : 'var(--danger)' }}>
              {feedback.benar ? '✅ Benar' : '❌ Salah'}
            </p>
            <button className="btn btn-primary" onClick={lanjut}>
              {feedback.status === 'selesai' ? 'Lihat Nilai →' : 'Lanjut →'}
            </button>
          </div>
        )}
      </div>
      <p className="muted" style={{ fontSize: '.78rem', marginTop: '1rem' }}>
        ⚠️ Tes dinilai. Jawaban tidak bisa diubah setelah dikirim.
      </p>
    </div>
  )
}
