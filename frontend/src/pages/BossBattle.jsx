import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { burstConfetti } from '../confetti'

const MAX_LIVES = 3

export default function BossBattle({ levelId }) {
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [phase, setPhase] = useState('materi')  // materi | main | menang | kalah

  const [qIdx, setQIdx] = useState(0)
  const [bossHp, setBossHp] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answer, setAnswer] = useState('')
  const [flash, setFlash] = useState('')       // pesan sekejap: 💥 / 💔
  const [reward, setReward] = useState(null)
  const busy = useRef(false)                    // kunci agar 1 soal diproses sekali

  useEffect(() => {
    client.get(`/boss/${levelId}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e?.response?.data?.detail || 'Gagal memuat boss.'))
  }, [levelId])

  const soal = data ? data.questions[qIdx % data.questions.length] : null

  // Timer mundur per soal
  useEffect(() => {
    if (phase !== 'main' || !data) return
    setTimeLeft(data.timer)
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(iv); tangani(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, phase, data])

  function mulai() {
    setBossHp(data.hp); setLives(MAX_LIVES); setQIdx(0)
    busy.current = false; setPhase('main')
  }

  async function jawab(val) {
    if (busy.current) return
    busy.current = true
    try {
      const { data: res } = await client.post('/answer', {
        question_id: soal.id, jawaban: String(val),
      })
      tangani(res.benar)
    } catch {
      busy.current = false
    }
  }

  // Proses hasil satu soal (benar = serang boss; salah/timeout = kurang nyawa)
  function tangani(benar) {
    if (benar) {
      const nhp = bossHp - 1
      setBossHp(nhp)
      setFlash('💥 -1 HP boss!')
      if (nhp <= 0) { menang(); return }
    } else {
      const nl = lives - 1
      setLives(nl)
      setFlash('💔 -1 nyawa')
      if (nl <= 0) { setTimeout(() => setPhase('kalah'), 800); return }
    }
    setTimeout(() => {
      setQIdx((i) => i + 1); setAnswer(''); setFlash(''); busy.current = false
    }, 800)
  }

  async function menang() {
    const stars = Math.max(1, lives)
    try {
      const { data: res } = await client.post(`/levels/${levelId}/complete`,
        { stars, score: data.hp * 100 })
      setReward({ ...res, stars })
    } catch {
      setReward({ stars, new_badges: [] })
    }
    setPhase('menang')
    burstConfetti()
  }

  if (err) return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
      <p>{err}</p>
      <button className="btn btn-primary" onClick={() => nav('/peta')}>← Peta</button>
    </div>
  )
  if (!data) return <p className="muted">Memuat…</p>

  // ---- Intro ----
  if (phase === 'materi') {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem' }}>{data.emoji}</div>
        <h1 style={{ margin: '.3rem 0' }}>{data.nama}</h1>
        <pre className="code" style={{ textAlign: 'left', marginTop: '1rem' }}>{data.materi}</pre>
        <p className="muted">HP boss: {data.hp} · Waktu: {data.timer} detik/soal · Nyawa: {MAX_LIVES} ❤️</p>
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>← Peta</button>
          <button className="btn btn-primary" onClick={mulai}>⚔️ Mulai Pertarungan!</button>
        </div>
      </div>
    )
  }

  // ---- Menang ----
  if (phase === 'menang') {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem' }}>🏆</div>
        <h1>Boss Terkalahkan!</h1>
        <div style={{ fontSize: '2rem', color: 'var(--gold)', margin: '.5rem 0' }}>
          {'⭐'.repeat(reward.stars)}{'☆'.repeat(3 - reward.stars)}
        </div>
        {reward.xp != null && (
          <p>Total XP: <b>{reward.xp}</b> · Koin: <b style={{ color: 'var(--gold)' }}>🪙 {reward.koin}</b></p>
        )}
        {reward.new_badges?.length > 0 && (
          <p style={{ color: 'var(--info)' }}>🎖️ Lencana baru: {reward.new_badges.join(', ')}</p>
        )}
        <button className="btn btn-primary" style={{ marginTop: '1rem' }}
                onClick={() => nav('/peta')}>Lanjut ke Peta →</button>
      </div>
    )
  }

  // ---- Kalah ----
  if (phase === 'kalah') {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem' }}>💀</div>
        <h1>Kamu kalah…</h1>
        <p className="muted">Boss masih tersisa {bossHp} HP. Coba lagi!</p>
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>← Peta</button>
          <button className="btn btn-primary" onClick={mulai}>🔄 Ulangi</button>
        </div>
      </div>
    )
  }

  // ---- Pertarungan ----
  const hpPct = Math.max(0, Math.round((bossHp / data.hp) * 100))
  const timePct = Math.round((timeLeft / data.timer) * 100)
  const timeColor = timeLeft <= 5 ? 'var(--danger)' : 'var(--info)'

  return (
    <div>
      {/* Boss + HP bar */}
      <div className="card" style={{ padding: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', transition: 'transform .1s',
                      transform: flash.includes('HP') ? 'scale(1.15) rotate(-4deg)' : 'none' }}>
          {data.emoji}
        </div>
        <div style={{ fontWeight: 700 }}>{data.nama}</div>
        <div style={{ height: 14, background: 'var(--bg)', borderRadius: 999, marginTop: '.5rem',
                      border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ width: `${hpPct}%`, height: '100%', background: 'var(--danger)',
                        transition: 'width .3s' }} />
        </div>
        <div className="muted" style={{ fontSize: '.8rem', marginTop: 2 }}>HP {bossHp} / {data.hp}</div>
      </div>

      {/* Status: nyawa + timer */}
      <div className="flex items-center justify-between" style={{ marginBottom: '.8rem' }}>
        <span style={{ fontSize: '1.1rem' }}>
          {'❤️'.repeat(lives)}{'🤍'.repeat(MAX_LIVES - lives)}
        </span>
        <span style={{ fontWeight: 700, color: timeColor }}>⏱️ {timeLeft}s</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg)', borderRadius: 999, overflow: 'hidden',
                    border: '1px solid var(--border)', marginBottom: '1rem' }}>
        <div style={{ width: `${timePct}%`, height: '100%', background: timeColor,
                      transition: 'width 1s linear' }} />
      </div>

      {/* Soal */}
      <div className={'card' + (flash.includes('nyawa') ? ' anim-shake' : '')} style={{ padding: '1.4rem' }}>
        {flash && (
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.2rem',
                        color: flash.includes('HP') ? 'var(--success)' : 'var(--danger)' }}>
            {flash}
          </div>
        )}
        {!flash && soal && (
          <>
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{soal.q}</h2>
            {soal.code && <pre className="code" style={{ margin: '1rem 0' }}>{soal.code}</pre>}

            {soal.tipe === 'mc' && (
              <div className="flex" style={{ flexDirection: 'column', gap: '.6rem', marginTop: '1rem' }}>
                {soal.opts.map((opt) => (
                  <button key={opt} className="btn btn-ghost" style={{ textAlign: 'left' }}
                          onClick={() => jawab(opt)}>{opt}</button>
                ))}
              </div>
            )}

            {(soal.tipe === 'out' || soal.tipe === 'blank') && (
              <form onSubmit={(e) => { e.preventDefault(); if (answer.trim()) jawab(answer) }}
                    style={{ marginTop: '1rem' }}>
                <input className="input" value={answer} autoFocus placeholder="Ketik jawabanmu…"
                       onChange={(e) => setAnswer(e.target.value)} />
                <button className="btn btn-primary" style={{ marginTop: '.8rem' }}
                        disabled={!answer.trim()}>Serang! ⚔️</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
