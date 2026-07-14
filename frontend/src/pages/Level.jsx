import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { runPython } from '../pyodide'

const MAX_LIVES = 3

export default function Level() {
  const { id } = useParams()
  const nav = useNavigate()

  const [level, setLevel] = useState(null)
  const [err, setErr] = useState('')
  const [phase, setPhase] = useState('materi')  // materi | main | gagal | selesai

  const [idx, setIdx] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [benarCount, setBenarCount] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)  // {benar, jawaban_benar}
  const [reward, setReward] = useState(null)
  const [showHint, setShowHint] = useState(false)

  // Gamifikasi combo (Fase 5)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [score, setScore] = useState(0)
  const [lastGain, setLastGain] = useState(0)

  // Soal tulis-kode (Fase 6, Pyodide)
  const [codeText, setCodeText] = useState('')
  const [codeOutput, setCodeOutput] = useState('')
  const [running, setRunning] = useState(false)

  const soal = level?.questions || []
  const current = soal[idx]

  useEffect(() => {
    client.get(`/levels/${id}`)
      .then((r) => setLevel(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || 'Gagal memuat level.'))
  }, [id])

  // Saat pindah ke soal tulis-kode, isi editor dengan kode awal (starter).
  useEffect(() => {
    if (current?.tipe === 'code') {
      setCodeText(current.starter || '')
      setCodeOutput('')
    }
  }, [idx, current?.id, current?.tipe, current?.starter])

  async function kirimJawaban(jawaban) {
    if (feedback) return null
    const { data } = await client.post('/answer', {
      question_id: current.id, jawaban: String(jawaban),
    })
    setFeedback(data)
    if (data.benar) {
      const newCombo = combo + 1
      const gain = 100 + Math.max(0, newCombo - 1) * 25
      setCombo(newCombo)
      setMaxCombo((m) => Math.max(m, newCombo))
      setScore((s) => s + gain)
      setBenarCount((c) => c + 1)
      setLastGain(gain)
    } else {
      setCombo(0)
      setLives((l) => l - 1)
      setLastGain(0)
    }
    return data
  }

  async function jalankanKode() {
    if (feedback || running) return
    setRunning(true)
    setCodeOutput('⏳ Menyiapkan Python & menjalankan… (pertama kali agak lama)')
    try {
      const out = await runPython(codeText)
      setCodeOutput(out || '(tidak ada output)')
      await kirimJawaban(out)  // kirim output ke backend untuk diperiksa
    } catch (e) {
      setCodeOutput('Gagal menjalankan: ' + (e.message || e))
    } finally {
      setRunning(false)
    }
  }

  async function lanjut() {
    const nyawaSisa = lives
    setFeedback(null)
    setAnswer('')
    setShowHint(false)

    if (nyawaSisa <= 0) { setPhase('gagal'); return }
    if (idx + 1 >= soal.length) {
      const stars = Math.max(1, nyawaSisa)
      const { data } = await client.post(`/levels/${id}/complete`, { stars, score })
      setReward({ ...data, stars, score, maxCombo })
      setPhase('selesai')
    } else {
      setIdx((i) => i + 1)
    }
  }

  function ulangi() {
    setIdx(0); setLives(MAX_LIVES); setBenarCount(0)
    setAnswer(''); setFeedback(null); setReward(null); setShowHint(false)
    setCombo(0); setMaxCombo(0); setScore(0); setLastGain(0)
    setCodeOutput('')
    setPhase('materi')
  }

  if (err) return <Pesan teks={err} onBack={() => nav('/peta')} />
  if (!level) return <p className="muted">Memuat…</p>

  // ---- Boss (Fase 8) ----
  if (level.is_boss) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>{level.emoji}</div>
        <h1>{level.nama}</h1>
        <p className="muted">
          ⚔️ Boss battle (timer + HP bar) akan aktif di <b>Fase 8</b>. Nantikan ya!
        </p>
        <button className="btn btn-primary" onClick={() => nav('/peta')}>← Kembali ke Peta</button>
      </div>
    )
  }

  // ---- Materi ----
  if (phase === 'materi') {
    return (
      <div className="card" style={{ padding: '1.8rem' }}>
        <div style={{ fontSize: '2.2rem' }}>{level.emoji}</div>
        <h1 style={{ margin: '.3rem 0' }}>Level {level.urutan}: {level.nama}</h1>
        <p className="muted" style={{ marginTop: 0 }}>Baca materi singkat ini dulu 👇</p>
        <pre className="code" style={{ marginTop: '1rem' }}>{level.materi}</pre>
        <div className="flex gap-3" style={{ marginTop: '1.2rem' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>← Peta</button>
          <button className="btn btn-primary" onClick={() => setPhase('main')}>
            Mulai ({soal.length} soal) →
          </button>
        </div>
      </div>
    )
  }

  // ---- Gagal ----
  if (phase === 'gagal') {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>💔</div>
        <h1>Nyawa habis!</h1>
        <p className="muted">Tenang, coba lagi — kamu pasti bisa.</p>
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>← Peta</button>
          <button className="btn btn-primary" onClick={ulangi}>🔄 Ulangi</button>
        </div>
      </div>
    )
  }

  // ---- Selesai ----
  if (phase === 'selesai') {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <h1>Level Selesai!</h1>
        <div style={{ fontSize: '2rem', color: 'var(--gold)', margin: '.5rem 0' }}>
          {'⭐'.repeat(reward.stars)}{'☆'.repeat(3 - reward.stars)}
        </div>
        <p style={{ margin: '.3rem 0' }}>
          Skor: <b>{reward.score}</b> · Combo tertinggi: <b style={{ color: 'var(--danger)' }}>🔥 {reward.maxCombo}</b>
        </p>
        <p style={{ margin: '.3rem 0' }}>
          Total XP: <b>{reward.xp}</b> · Koin: <b style={{ color: 'var(--gold)' }}>🪙 {reward.koin}</b>
        </p>
        <p className="muted" style={{ marginTop: 0 }}>{reward.rank} · Level pemain {reward.player_level}</p>
        {reward.new_badges?.length > 0 && (
          <p style={{ color: 'var(--info)' }}>🎖️ Lencana baru: {reward.new_badges.join(', ')}</p>
        )}
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1.2rem' }}>
          <button className="btn btn-ghost" onClick={ulangi}>🔄 Ulangi</button>
          <button className="btn btn-primary" onClick={() => nav('/peta')}>Lanjut ke Peta →</button>
        </div>
      </div>
    )
  }

  // ---- Main (mengerjakan soal) ----
  return (
    <div>
      {/* Bar status: progres + combo + nyawa */}
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <span className="muted">Soal {idx + 1} / {soal.length} · {level.nama}</span>
        <span className="flex items-center gap-3">
          {combo >= 2 && (
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>🔥 Combo x{combo}</span>
          )}
          <span style={{ fontSize: '1.1rem' }}>
            {'❤️'.repeat(lives)}{'🤍'.repeat(MAX_LIVES - lives)}
          </span>
        </span>
      </div>

      <div className="card" style={{ padding: '1.6rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>{current.q}</h2>

        {current.code && <pre className="code" style={{ margin: '1rem 0' }}>{current.code}</pre>}

        {/* Pilihan ganda */}
        {current.tipe === 'mc' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '.6rem', marginTop: '1rem' }}>
            {current.opts.map((opt) => {
              let border = 'var(--border)'
              if (feedback) {
                if (opt === answer && feedback.benar) border = 'var(--success)'
                else if (opt === answer && !feedback.benar) border = 'var(--danger)'
              }
              return (
                <button key={opt} className="btn btn-ghost"
                        style={{ textAlign: 'left', borderColor: border }}
                        disabled={!!feedback}
                        onClick={() => { setAnswer(opt); kirimJawaban(opt) }}>
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {/* Tebak output / lengkapi kode */}
        {(current.tipe === 'out' || current.tipe === 'blank') && (
          <form onSubmit={(e) => { e.preventDefault(); if (!feedback && answer.trim()) kirimJawaban(answer) }}
                style={{ marginTop: '1rem' }}>
            <input className="input" value={answer} disabled={!!feedback} autoFocus
                   placeholder="Ketik jawabanmu…"
                   onChange={(e) => setAnswer(e.target.value)} />
            {!feedback && (
              <button className="btn btn-primary" style={{ marginTop: '.8rem' }}
                      disabled={!answer.trim()}>Jawab</button>
            )}
          </form>
        )}

        {/* Tulis kode Python sungguhan (dijalankan di browser via Pyodide) */}
        {current.tipe === 'code' && (
          <div style={{ marginTop: '1rem' }}>
            <textarea className="input" value={codeText} disabled={!!feedback} spellCheck={false}
                      onChange={(e) => setCodeText(e.target.value)}
                      style={{ fontFamily: 'Consolas, monospace', minHeight: 150,
                               whiteSpace: 'pre', lineHeight: 1.5 }} />
            {!feedback && (
              <button className="btn btn-primary" style={{ marginTop: '.8rem' }}
                      disabled={running} onClick={jalankanKode}>
                {running ? '⏳ Menjalankan…' : '▶ Jalankan & Periksa'}
              </button>
            )}
            {codeOutput && (
              <div style={{ marginTop: '.8rem' }}>
                <div className="muted" style={{ fontSize: '.78rem', marginBottom: 4 }}>Output:</div>
                <pre className="code">{codeOutput}</pre>
              </div>
            )}
          </div>
        )}

        {/* Petunjuk */}
        {!feedback && current.hint && (
          <p style={{ marginTop: '1rem' }}>
            {showHint
              ? <span className="muted">💡 {current.hint}</span>
              : <button className="btn btn-ghost" style={{ fontSize: '.82rem', padding: '.35rem .7rem' }}
                        onClick={() => setShowHint(true)}>💡 Lihat petunjuk</button>}
          </p>
        )}

        {/* Umpan balik benar/salah */}
        {feedback && (
          <div style={{ marginTop: '1.2rem' }}>
            {feedback.benar ? (
              <p style={{ color: 'var(--success)', fontWeight: 700 }}>
                ✅ Benar! <span style={{ color: 'var(--gold)' }}>+{lastGain}</span>
                {combo >= 2 && <span style={{ color: 'var(--danger)' }}> 🔥 x{combo}</span>}
              </p>
            ) : (
              <p style={{ color: 'var(--danger)', fontWeight: 700 }}>
                ❌ Kurang tepat.{feedback.jawaban_benar
                  ? <> Jawaban benar: <code>{feedback.jawaban_benar}</code></>
                  : ' Cek lagi output-nya ya.'}
              </p>
            )}
            <button className="btn btn-primary" onClick={lanjut}>
              {idx + 1 >= soal.length ? 'Selesaikan Level →' : 'Lanjut →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Pesan({ teks, onBack }) {
  return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
      <p>{teks}</p>
      <button className="btn btn-primary" onClick={onBack}>← Kembali ke Peta</button>
    </div>
  )
}
