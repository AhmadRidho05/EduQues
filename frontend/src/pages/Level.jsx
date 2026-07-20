import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { runPython } from '../pyodide'
import { burstConfetti } from '../confetti'
import BossBattle from './BossBattle'

const MAX_LIVES = 3

export default function Level() {
  const { id } = useParams()
  const nav = useNavigate()

  const [level, setLevel] = useState(null)
  const [soalList, setSoalList] = useState([])   // soal hasil acak dari percobaan (server)
  const [err, setErr] = useState('')
  const [phase, setPhase] = useState('loading')  // loading | materi | main | gagal | selesai

  // Status ini dikendalikan SERVER (anti-cheat): kita cuma menampilkan.
  const [idx, setIdx] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [lanjutan, setLanjutan] = useState(false)  // true kalau melanjutkan percobaan lama

  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)   // respons jawaban terakhir dari server
  const [reward, setReward] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [busy, setBusy] = useState(false)

  const [codeText, setCodeText] = useState('')
  const [codeOutput, setCodeOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [justLost, setJustLost] = useState(false)  // untuk animasi hati pecah

  const soal = soalList[idx]
  const total = soalList.length
  const maxLives = level?.lives ?? MAX_LIVES   // jumlah nyawa diatur dosen per level

  // Muat level + status percobaan yang tersimpan di server
  useEffect(() => {
    let ok = true
    async function load() {
      try {
        const [lv, at] = await Promise.all([
          client.get(`/levels/${id}`),
          client.get(`/levels/${id}/attempt`),
        ])
        if (!ok) return
        setLevel(lv.data)
        if (lv.data.is_boss) return
        if (at.data.active) {          // ada percobaan belum selesai -> lanjutkan
          setSoalList(at.data.questions || [])
          setIdx(at.data.idx); setLives(at.data.lives)
          setScore(at.data.score); setCombo(at.data.combo)
          setLanjutan(at.data.idx > 0)
          setPhase('main')
        } else {
          setPhase('materi')
        }
      } catch (e) {
        if (ok) setErr(e?.response?.data?.detail || 'Gagal memuat level.')
      }
    }
    load()
    return () => { ok = false }
  }, [id])

  // Isi editor kode saat pindah ke soal tulis-kode
  useEffect(() => {
    if (soal?.tipe === 'code') { setCodeText(soal.starter || ''); setCodeOutput('') }
  }, [idx, soal?.id, soal?.tipe, soal?.starter])

  // Confetti saat level selesai 🎉
  useEffect(() => {
    if (phase === 'selesai') burstConfetti()
  }, [phase])

  async function mulai() {
    const { data } = await client.post(`/levels/${id}/attempt/start`)
    setSoalList(data.questions || [])
    setIdx(data.idx); setLives(data.lives); setScore(data.score); setCombo(data.combo)
    setFeedback(null); setAnswer(''); setCodeOutput(''); setShowHint(false)
    setLanjutan(false); setReward(null)
    setPhase('main')
  }

  async function kirim(val) {
    if (busy || feedback) return
    setBusy(true)
    try {
      const { data } = await client.post(`/levels/${id}/attempt/answer`,
        { jawaban: String(val) })
      setFeedback(data)
      setLives(data.lives); setScore(data.score); setCombo(data.combo)
      if (!data.benar) { setJustLost(true); setTimeout(() => setJustLost(false), 600) }
    } catch (e) {
      setErr(e?.response?.data?.detail || 'Gagal mengirim jawaban.')
    } finally {
      setBusy(false)
    }
  }

  async function jalankanKode() {
    if (feedback || running) return
    setRunning(true)
    setCodeOutput('⏳ Menyiapkan Python & menjalankan… (pertama kali agak lama)')
    try {
      const out = await runPython(codeText)
      setCodeOutput(out || '(tidak ada output)')
      await kirim(out)
    } catch (e) {
      setCodeOutput('Gagal menjalankan: ' + (e.message || e))
    } finally {
      setRunning(false)
    }
  }

  function lanjut() {
    const fb = feedback
    setFeedback(null); setAnswer(''); setShowHint(false); setCodeOutput('')
    if (fb.status === 'failed') { setPhase('gagal'); return }
    if (fb.status === 'completed') { setReward(fb.reward); setPhase('selesai'); return }
    setIdx(fb.idx)  // lanjut ke soal berikutnya (nomor dari server)
  }

  if (err) return <Pesan teks={err} onBack={() => nav('/peta')} />
  if (!level) return <p className="muted">Memuat…</p>

  // ---- Boss battle (Fase 8) ---- (dicek SEBELUM gerbang 'loading',
  // karena untuk boss phase memang tidak dipakai)
  if (level.is_boss) return <BossBattle levelId={id} />

  if (phase === 'loading') return <p className="muted">Memuat…</p>

  // ---- Materi ----
  if (phase === 'materi') {
    return (
      <div className="card" style={{ padding: '1.8rem' }}>
        <div style={{ fontSize: '2.2rem' }}>{level.emoji}</div>
        <h1 style={{ margin: '.3rem 0' }}>Level {level.urutan}: {level.nama}</h1>
        <p className="muted" style={{ marginTop: 0 }}>Baca materi singkat ini dulu 👇</p>
        <pre className="code" style={{ marginTop: '1rem' }}>{level.materi}</pre>
        <p className="muted" style={{ fontSize: '.82rem' }}>
          ⚠️ Sekali mulai, nyawa yang berkurang tetap tercatat walau kamu keluar —
          jadi kerjakan sampai selesai atau nyawa habis! 🔀 Soal &amp; urutannya diacak.
        </p>
        <div className="flex gap-3" style={{ marginTop: '1.2rem' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>← Peta</button>
          <button className="btn btn-primary" onClick={mulai}>Mulai ({level.jumlah_soal} soal) →</button>
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
        <p className="muted">Percobaan ini selesai. Mulai lagi dari awal dengan nyawa penuh.</p>
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>← Peta</button>
          <button className="btn btn-primary" onClick={mulai}>🔄 Coba Lagi</button>
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
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < reward.stars ? 'anim-star' : ''}
                  style={{ animationDelay: `${i * 0.22}s` }}>
              {i < reward.stars ? '⭐' : '☆'}
            </span>
          ))}
        </div>
        <p style={{ margin: '.3rem 0' }}>
          Skor: <b>{reward.score}</b> · Combo tertinggi: <b style={{ color: 'var(--danger)' }}>🔥 {reward.max_combo}</b>
        </p>
        <p style={{ margin: '.3rem 0' }}>
          Total XP: <b>{reward.xp}</b> · Koin: <b style={{ color: 'var(--gold)' }}>🪙 {reward.koin}</b>
        </p>
        <p className="muted" style={{ marginTop: 0 }}>{reward.rank} · Level pemain {reward.player_level}</p>
        {reward.new_badges?.length > 0 && (
          <p style={{ color: 'var(--info)' }}>🎖️ Lencana baru: {reward.new_badges.join(', ')}</p>
        )}
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1.2rem' }}>
          <button className="btn btn-ghost" onClick={mulai}>🔄 Ulangi</button>
          <button className="btn btn-primary" onClick={() => nav('/peta')}>Lanjut ke Peta →</button>
        </div>
      </div>
    )
  }

  // ---- Main (mengerjakan soal) ----
  return (
    <div className={feedback && !feedback.benar ? 'anim-shake' : ''}>
      {lanjutan && !feedback && (
        <p className="muted" style={{ fontSize: '.82rem', marginBottom: '.5rem' }}>
          ▶️ Melanjutkan percobaan sebelumnya (nyawa & posisi soal tersimpan).
        </p>
      )}
      <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
        <span className="muted">Soal {idx + 1} / {total} · {level.nama}</span>
        <span className="flex items-center gap-3">
          {combo >= 2 && (
            <span key={combo} className="anim-combo"
                  style={{ color: 'var(--danger)', fontWeight: 700 }}>🔥 Combo x{combo}</span>
          )}
          <span style={{ fontSize: '1.1rem' }}>
            {Array.from({ length: maxLives }).map((_, i) => {
              if (i < lives) return <span key={i}>❤️</span>
              if (i === lives && justLost) return <span key={i} className="anim-break">❤️</span>
              return <span key={i}>🤍</span>
            })}
          </span>
        </span>
      </div>

      <div key={idx} className="card fade-in" style={{ padding: '1.6rem', position: 'relative' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>{soal.q}</h2>
        {soal.code && <pre className="code" style={{ margin: '1rem 0' }}>{soal.code}</pre>}

        {/* Pilihan ganda */}
        {soal.tipe === 'mc' && (
          <div className="flex" style={{ flexDirection: 'column', gap: '.6rem', marginTop: '1rem' }}>
            {soal.opts.map((opt) => {
              let border = 'var(--border)'
              if (feedback) {
                if (opt === answer && feedback.benar) border = 'var(--success)'
                else if (opt === answer && !feedback.benar) border = 'var(--danger)'
              }
              return (
                <button key={opt} className="btn btn-ghost"
                        style={{ textAlign: 'left', borderColor: border }}
                        disabled={!!feedback || busy}
                        onClick={() => { setAnswer(opt); kirim(opt) }}>{opt}</button>
              )
            })}
          </div>
        )}

        {/* Tebak output / lengkapi kode */}
        {(soal.tipe === 'out' || soal.tipe === 'blank') && (
          <form onSubmit={(e) => { e.preventDefault(); if (!feedback && answer.trim()) kirim(answer) }}
                style={{ marginTop: '1rem' }}>
            <input className="input" value={answer} disabled={!!feedback} autoFocus
                   placeholder="Ketik jawabanmu…" onChange={(e) => setAnswer(e.target.value)} />
            {!feedback && (
              <button className="btn btn-primary" style={{ marginTop: '.8rem' }}
                      disabled={!answer.trim() || busy}>Jawab</button>
            )}
          </form>
        )}

        {/* Tulis kode Python (Pyodide) */}
        {soal.tipe === 'code' && (
          <div style={{ marginTop: '1rem' }}>
            <textarea className="input" value={codeText} disabled={!!feedback} spellCheck={false}
                      onChange={(e) => setCodeText(e.target.value)}
                      style={{ fontFamily: 'Consolas, monospace', minHeight: 150,
                               whiteSpace: 'pre', lineHeight: 1.5 }} />
            {!feedback && (
              <button className="btn btn-primary" style={{ marginTop: '.8rem' }}
                      disabled={running || busy} onClick={jalankanKode}>
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
        {!feedback && soal.hint && (
          <p style={{ marginTop: '1rem' }}>
            {showHint
              ? <span className="muted">💡 {soal.hint}</span>
              : <button className="btn btn-ghost" style={{ fontSize: '.82rem', padding: '.35rem .7rem' }}
                        onClick={() => setShowHint(true)}>💡 Lihat petunjuk</button>}
          </p>
        )}

        {/* Umpan balik */}
        {feedback && (
          <div style={{ marginTop: '1.2rem' }}>
            {feedback.benar && (
              <span className="float-plus" style={{ top: '35%', color: 'var(--gold)' }}>+{feedback.gain}</span>
            )}
            {feedback.benar ? (
              <p className="anim-pop" style={{ color: 'var(--success)', fontWeight: 700, display: 'inline-block' }}>
                ✅ Benar! <span style={{ color: 'var(--gold)' }}>+{feedback.gain}</span>
                {combo >= 2 && <span style={{ color: 'var(--danger)' }}> 🔥 x{combo}</span>}
              </p>
            ) : (
              <p style={{ color: 'var(--danger)', fontWeight: 700 }}>
                ❌ Kurang tepat. −1 nyawa.{feedback.jawaban_benar
                  ? <> Jawaban benar: <code>{feedback.jawaban_benar}</code></>
                  : ' Cek lagi output-nya ya.'}
              </p>
            )}
            <button className="btn btn-primary" onClick={lanjut}>
              {feedback.status === 'active' ? 'Lanjut →' : 'Lihat Hasil →'}
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
