import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { runPython } from '../pyodide'
import { burstConfetti } from '../confetti'
import BossBattle from './BossBattle'
import Icon from '../components/Icon'

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
  const [kirimErr, setKirimErr] = useState('')     // error transien (jawab/mulai), bukan fatal

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
    setKirimErr('')
    try {
      const { data } = await client.post(`/levels/${id}/attempt/start`)
      setSoalList(data.questions || [])
      setIdx(data.idx); setLives(data.lives); setScore(data.score); setCombo(data.combo)
      setFeedback(null); setAnswer(''); setCodeOutput(''); setShowHint(false)
      setLanjutan(false); setReward(null)
      setPhase('main')
    } catch (e) {
      setKirimErr(e?.response?.data?.detail || 'Gagal memulai level. Coba lagi.')
    }
  }

  async function kirim(val) {
    if (busy || feedback) return
    setBusy(true)
    setKirimErr('')
    try {
      const { data } = await client.post(`/levels/${id}/attempt/answer`,
        { jawaban: String(val) })
      setFeedback(data)
      setLives(data.lives); setScore(data.score); setCombo(data.combo)
      if (!data.benar) { setJustLost(true); setTimeout(() => setJustLost(false), 600) }
    } catch (e) {
      // error transien: tampilkan banner, JANGAN buang seluruh progres di layar
      setKirimErr(e?.response?.data?.detail || 'Gagal mengirim jawaban. Coba lagi.')
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
    setFeedback(null); setAnswer(''); setShowHint(false); setCodeOutput(''); setKirimErr('')
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
    const belumAdaSoal = !level.jumlah_soal
    return (
      <div className="card card-accent fade-in" style={{ padding: '1.8rem', maxWidth: 620, margin: '0 auto' }}>
        <div className="flex items-center gap-3">
          <span style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                         display: 'grid', placeItems: 'center', fontSize: '1.8rem',
                         background: 'var(--grad-brand-soft)',
                         border: '1px solid var(--border)' }}>{level.emoji}</span>
          <div>
            <span className="pill pill-accent" style={{ fontSize: '.72rem' }}>Bab {level.urutan}</span>
            <h1 style={{ margin: '.3rem 0 0', fontSize: '1.4rem' }}>{level.nama}</h1>
          </div>
        </div>

        {level.materi
          ? <>
              <p className="muted section-title" style={{ marginTop: '1.4rem', fontSize: '.95rem' }}>Materi Singkat</p>
              <pre className="code" style={{ marginTop: '.6rem' }}>{level.materi}</pre>
            </>
          : <p className="muted" style={{ marginTop: '1.2rem' }}>Belum ada materi tertulis untuk bab ini.</p>}

        {belumAdaSoal ? (
          <>
            <div className="empty" style={{ marginTop: '1.2rem', padding: '1.4rem' }}>
              <div className="empty-ico" style={{ color: 'var(--danger)' }}><Icon name="waktu" size={22} /></div>
              <p style={{ margin: 0, fontWeight: 700 }}>Bab ini belum ada soalnya</p>
              <p className="muted" style={{ margin: '.2rem 0 0', fontSize: '.86rem' }}>
                Tunggu dosenmu mengisi soal dulu ya.
              </p>
            </div>
            <div className="flex gap-3" style={{ marginTop: '1.2rem' }}>
              <button className="btn btn-primary" onClick={() => nav('/peta')}>
                <Icon name="kiri" size={15} /> Kembali ke Peta
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="card" style={{ padding: '.8rem 1rem', marginTop: '1.2rem',
                 background: 'var(--bg-soft)', display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--gold)', display: 'flex', marginTop: 2 }}><Icon name="info" size={16} /></span>
              <span className="muted" style={{ fontSize: '.82rem' }}>
                Sekali mulai, nyawa yang berkurang tetap tercatat walau kamu keluar — kerjakan
                sampai selesai atau nyawa habis. Soal &amp; urutannya diacak.
              </span>
            </div>
            {kirimErr && <p style={{ color: 'var(--danger)', marginTop: '.8rem' }}>⚠️ {kirimErr}</p>}
            <div className="flex gap-3" style={{ marginTop: '1.2rem' }}>
              <button className="btn btn-ghost" onClick={() => nav('/peta')}>
                <Icon name="kiri" size={15} /> Peta
              </button>
              <button className="btn btn-primary" onClick={mulai}>
                Mulai ({level.jumlah_soal} soal) <Icon name="kanan" size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ---- Gagal ----
  if (phase === 'gagal') {
    return (
      <div className="card fade-in" style={{ padding: '2.2rem', textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
        <div className="empty-ico anim-float" style={{ fontSize: '2rem', color: 'var(--danger)',
             borderColor: 'color-mix(in srgb, var(--danger) 40%, var(--border))' }}>💔</div>
        <h1 style={{ margin: '.2rem 0' }}>Nyawa habis!</h1>
        <p className="muted">Percobaan ini selesai. Mulai lagi dari awal dengan nyawa penuh.</p>
        {kirimErr && <p style={{ color: 'var(--danger)' }}>⚠️ {kirimErr}</p>}
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1.2rem' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>
            <Icon name="kiri" size={15} /> Peta
          </button>
          <button className="btn btn-primary" onClick={mulai}>
            <Icon name="ulang" size={15} /> Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  // ---- Selesai ----
  if (phase === 'selesai') {
    return (
      <div className="card card-accent fade-in" style={{ padding: '2.2rem', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div className="empty-ico anim-float" style={{ fontSize: '2rem', color: 'var(--gold)',
             borderColor: 'color-mix(in srgb, var(--gold) 40%, var(--border))' }}>🎉</div>
        <h1 style={{ margin: '.2rem 0' }}>Bab Selesai!</h1>
        <div style={{ fontSize: '2.4rem', margin: '.4rem 0' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < reward.stars ? 'anim-star' : ''}
                  style={{ animationDelay: `${i * 0.22}s`,
                           filter: i < reward.stars ? 'none' : 'grayscale(1) opacity(.35)' }}>
              ⭐
            </span>
          ))}
        </div>

        <div className="flex gap-2" style={{ justifyContent: 'center', flexWrap: 'wrap', margin: '1rem 0' }}>
          <div className="stat" style={{ flex: '1 1 100px', padding: '.7rem', minWidth: 90 }}>
            <div className="stat-num" style={{ fontSize: '1.3rem' }}>{reward.score}</div>
            <div className="stat-lbl">Skor</div>
          </div>
          <div className="stat" style={{ flex: '1 1 100px', padding: '.7rem', minWidth: 90 }}>
            <div className="stat-num" style={{ fontSize: '1.3rem', color: 'var(--danger)' }}>🔥 {reward.max_combo}</div>
            <div className="stat-lbl">Combo tertinggi</div>
          </div>
          <div className="stat" style={{ flex: '1 1 100px', padding: '.7rem', minWidth: 90 }}>
            <div className="stat-num" style={{ fontSize: '1.3rem', color: 'var(--gold)' }}>🪙 {reward.koin}</div>
            <div className="stat-lbl">Total koin</div>
          </div>
        </div>

        <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
          {reward.rank} · Total XP {reward.xp} · Level pemain {reward.player_level}
        </p>
        {reward.new_badges?.length > 0 && (
          <div className="pill pill-accent" style={{ marginTop: '.8rem', color: 'var(--primary)' }}>
            <Icon name="lencana" size={14} /> Lencana baru: {reward.new_badges.join(', ')}
          </div>
        )}
        {kirimErr && <p style={{ color: 'var(--danger)', marginTop: '.8rem' }}>⚠️ {kirimErr}</p>}
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1.3rem' }}>
          <button className="btn btn-ghost" onClick={mulai}>
            <Icon name="ulang" size={15} /> Ulangi
          </button>
          <button className="btn btn-primary" onClick={() => nav('/peta')}>
            Lanjut ke Peta <Icon name="kanan" size={15} />
          </button>
        </div>
      </div>
    )
  }

  // Guard: kalau soal entah kenapa tak tersedia di fase main, jangan white-screen
  if (!soal) return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
      <p className="muted">Soal tidak tersedia. Coba mulai ulang.</p>
      <button className="btn btn-primary" style={{ marginTop: '.6rem' }}
              onClick={() => nav('/peta')}>← Kembali ke Peta</button>
    </div>
  )

  // ---- Main (mengerjakan soal) ----
  return (
    <div className={feedback && !feedback.benar ? 'anim-shake' : ''}>
      {kirimErr && (
        <div style={{ background: 'var(--danger)', color: '#fff', padding: '.6rem .9rem',
                      borderRadius: 10, marginBottom: '.8rem', fontSize: '.88rem',
                      display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span>⚠️ {kirimErr}</span>
          <button className="btn btn-ghost" onClick={() => setKirimErr('')}
                  style={{ marginLeft: 'auto', padding: '.1rem .5rem', color: '#fff' }}>✕</button>
        </div>
      )}
      {lanjutan && !feedback && (
        <p className="muted" style={{ fontSize: '.82rem', marginBottom: '.5rem' }}>
          ▶️ Melanjutkan percobaan sebelumnya (nyawa & posisi soal tersimpan).
        </p>
      )}
      {/* HUD permainan */}
      <div className="card" style={{ padding: '.9rem 1.1rem', marginBottom: '1rem' }}>
        <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
            <span style={{ fontSize: '1.2rem' }}>{level.emoji}</span>
            <span style={{ fontWeight: 700, overflow: 'hidden',
                           textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{level.nama}</span>
          </div>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            {combo >= 2 && (
              <span key={combo} className="anim-combo pill"
                    style={{ color: 'var(--danger)', fontWeight: 700,
                             borderColor: 'color-mix(in srgb, var(--danger) 45%, var(--border))' }}>
                🔥 Combo x{combo}
              </span>
            )}
            <span className="pill" style={{ color: 'var(--gold)' }}>
              <Icon name="kilat" size={13} /> {score}
            </span>
            <span style={{ fontSize: '1.05rem', letterSpacing: '-1px' }}>
              {Array.from({ length: maxLives }).map((_, i) => {
                if (i < lives) return <span key={i}>❤️</span>
                if (i === lives && justLost) return <span key={i} className="anim-break">❤️</span>
                return <span key={i}>🤍</span>
              })}
            </span>
          </div>
        </div>
        <div className="flex justify-between" style={{ fontSize: '.76rem', margin: '.7rem 0 4px' }}>
          <span className="muted">Soal {idx + 1} dari {total}</span>
          <span className="muted">{Math.round((idx / Math.max(1, total)) * 100)}%</span>
        </div>
        <div className="bar bar-sm">
          <i style={{ width: `${Math.round((idx / Math.max(1, total)) * 100)}%` }} />
        </div>
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
