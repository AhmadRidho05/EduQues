import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { burstConfetti } from '../confetti'
import Icon from '../components/Icon'

// Pertarungan boss SERVER-AUTHORITATIVE: HP boss, nyawa, & soal dipegang server.
// Refresh tidak mereset (dilanjut dari state tersimpan), dan menang tak bisa dipalsukan.
export default function BossBattle({ levelId }) {
  const nav = useNavigate()
  const [data, setData] = useState(null)      // meta boss + attempt (kalau ada)
  const [err, setErr] = useState('')
  const [phase, setPhase] = useState('materi') // materi | main | menang | kalah

  const [bossHp, setBossHp] = useState(0)
  const [lives, setLives] = useState(0)
  const [question, setQuestion] = useState(null)   // soal aktif (dari server)
  const [timeLeft, setTimeLeft] = useState(0)
  const [answer, setAnswer] = useState('')
  const [flash, setFlash] = useState('')       // pesan sekejap: 💥 / 💔
  const [reward, setReward] = useState(null)
  const [kirimErr, setKirimErr] = useState('')
  const busy = useRef(false)                    // kunci agar 1 soal diproses sekali

  const maxLives = data?.lives || 3
  const adaSoal = !!(data && data.ada_soal)

  useEffect(() => {
    client.get(`/boss/${levelId}`)
      .then((r) => {
        setData(r.data)
        if (r.data.attempt) {                  // lanjutkan pertarungan tersimpan
          setBossHp(r.data.attempt.boss_hp)
          setLives(r.data.attempt.lives)
          setQuestion(r.data.attempt.question)
          setPhase('main')
        }
      })
      .catch((e) => setErr(e?.response?.data?.detail || 'Gagal memuat boss.'))
  }, [levelId])

  // Timer mundur per soal (server dikabari lewat flag habis saat 0)
  useEffect(() => {
    if (phase !== 'main' || !data || !question) return
    setTimeLeft(data.timer)
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(iv); kirim(null, true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, phase, data])

  async function mulai() {
    setKirimErr('')
    try {
      const { data: s } = await client.post(`/boss/${levelId}/start`)
      setBossHp(s.boss_hp); setLives(s.lives); setQuestion(s.question)
      setAnswer(''); setFlash(''); setReward(null)
      busy.current = false
      setPhase('main')
    } catch (e) {
      setKirimErr(e?.response?.data?.detail || 'Gagal memulai pertarungan.')
    }
  }

  async function kirim(val, habis = false) {
    if (busy.current) return
    busy.current = true
    setKirimErr('')
    try {
      const { data: res } = await client.post(`/boss/${levelId}/answer`, {
        jawaban: String(val ?? ''), habis,
      })
      setBossHp(res.boss_hp); setLives(res.lives)
      setFlash(res.benar ? '💥 -1 HP boss!' : '💔 -1 nyawa')
      setTimeout(() => {
        setFlash(''); setAnswer('')
        if (res.status === 'menang') {
          setReward(res.reward); setPhase('menang'); burstConfetti()
        } else if (res.status === 'kalah') {
          setPhase('kalah')
        } else {
          setQuestion(res.question); busy.current = false
        }
      }, 800)
    } catch (e) {
      busy.current = false
      setKirimErr(e?.response?.data?.detail || 'Gagal mengirim jawaban. Coba lagi.')
    }
  }

  if (err) return (
    <div className="card fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
      <div className="empty-ico" style={{ color: 'var(--danger)' }}><Icon name="info" size={24} /></div>
      <p>{err}</p>
      <button className="btn btn-primary" onClick={() => nav('/peta')}>
        <Icon name="kiri" size={15} /> Peta
      </button>
    </div>
  )
  if (!data) return <div className="skeleton" style={{ height: 340, maxWidth: 620, margin: '0 auto' }} />

  // Boss tanpa soal -> jangan render pertarungan kosong
  if (!adaSoal) return (
    <div className="card fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
      <div className="empty-ico anim-float" style={{ fontSize: '1.8rem' }}>🛠️</div>
      <h2 style={{ margin: '.4rem 0' }}>Boss belum siap</h2>
      <p className="muted">Bab-bab sebelum boss ini belum punya soal, jadi pertarungan
        belum bisa dimulai. Hubungi dosenmu untuk mengisi soal dulu ya.</p>
      <button className="btn btn-primary" style={{ marginTop: '1rem' }}
              onClick={() => nav('/peta')}>
        <Icon name="kiri" size={15} /> Kembali ke Peta
      </button>
    </div>
  )

  // ---- Intro ----
  if (phase === 'materi') {
    return (
      <div className="card card-accent fade-in" style={{ padding: '2rem', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
        <div className="anim-float" style={{ fontSize: '3.6rem', filter: 'drop-shadow(0 6px 16px rgba(239,68,68,.4))' }}>{data.emoji}</div>
        <span className="pill" style={{ color: 'var(--danger)', marginTop: '.4rem',
              borderColor: 'color-mix(in srgb, var(--danger) 45%, var(--border))' }}>BOSS</span>
        <h1 style={{ margin: '.5rem 0' }}>{data.nama}</h1>
        {data.materi && (
          <pre className="code" style={{ textAlign: 'left', marginTop: '1rem' }}>{data.materi}</pre>
        )}
        <div className="flex gap-2" style={{ justifyContent: 'center', flexWrap: 'wrap', margin: '1.2rem 0' }}>
          <span className="pill" style={{ color: 'var(--danger)' }}>
            <Icon name="api" size={14} /> HP {data.hp}
          </span>
          <span className="pill" style={{ color: 'var(--info)' }}>
            <Icon name="waktu" size={14} /> {data.timer}s / soal
          </span>
          <span className="pill" style={{ color: 'var(--danger)' }}>
            <Icon name="nyawa" size={14} /> {maxLives} nyawa
          </span>
        </div>
        {kirimErr && <p style={{ color: 'var(--danger)' }}>⚠️ {kirimErr}</p>}
        <div className="flex gap-3" style={{ justifyContent: 'center' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>
            <Icon name="kiri" size={15} /> Peta
          </button>
          <button className="btn btn-danger" onClick={mulai}>⚔️ Mulai Pertarungan!</button>
        </div>
      </div>
    )
  }

  // ---- Menang ----
  if (phase === 'menang') {
    return (
      <div className="card card-accent fade-in" style={{ padding: '2.2rem', textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
        <div className="empty-ico anim-float" style={{ fontSize: '2rem', color: 'var(--gold)',
             borderColor: 'color-mix(in srgb, var(--gold) 40%, var(--border))' }}>🏆</div>
        <h1 style={{ margin: '.2rem 0' }}>Boss Terkalahkan!</h1>
        <div style={{ fontSize: '2.4rem', margin: '.4rem 0' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={i < (reward?.stars || 0) ? 'anim-star' : ''}
                  style={{ animationDelay: `${i * 0.22}s`,
                           filter: i < (reward?.stars || 0) ? 'none' : 'grayscale(1) opacity(.35)' }}>⭐</span>
          ))}
        </div>
        {reward?.xp != null && (
          <p className="muted" style={{ margin: '.4rem 0 0' }}>
            Total XP <b style={{ color: 'var(--text)' }}>{reward.xp}</b> · Koin
            <b style={{ color: 'var(--gold)' }}> 🪙 {reward.koin}</b>
          </p>
        )}
        {reward?.new_badges?.length > 0 && (
          <div className="pill pill-accent" style={{ marginTop: '.8rem', color: 'var(--primary)' }}>
            <Icon name="lencana" size={14} /> Lencana baru: {reward.new_badges.join(', ')}
          </div>
        )}
        <div style={{ marginTop: '1.3rem' }}>
          <button className="btn btn-primary" onClick={() => nav('/peta')}>
            Lanjut ke Peta <Icon name="kanan" size={15} />
          </button>
        </div>
      </div>
    )
  }

  // ---- Kalah ----
  if (phase === 'kalah') {
    return (
      <div className="card fade-in" style={{ padding: '2.2rem', textAlign: 'center', maxWidth: 460, margin: '0 auto' }}>
        <div className="empty-ico anim-float" style={{ fontSize: '2rem', color: 'var(--danger)',
             borderColor: 'color-mix(in srgb, var(--danger) 40%, var(--border))' }}>💀</div>
        <h1 style={{ margin: '.2rem 0' }}>Kamu kalah…</h1>
        <p className="muted">Boss masih tersisa {bossHp} HP. Coba lagi!</p>
        <div className="flex gap-3" style={{ justifyContent: 'center', marginTop: '1.2rem' }}>
          <button className="btn btn-ghost" onClick={() => nav('/peta')}>
            <Icon name="kiri" size={15} /> Peta
          </button>
          <button className="btn btn-danger" onClick={mulai}>
            <Icon name="ulang" size={15} /> Ulangi
          </button>
        </div>
      </div>
    )
  }

  // ---- Pertarungan ----
  if (!question) return <div className="skeleton" style={{ height: 300 }} />
  const hpPct = Math.max(0, Math.round((bossHp / data.hp) * 100))
  const timePct = Math.round((timeLeft / data.timer) * 100)
  const timeColor = timeLeft <= 5 ? 'var(--danger)' : 'var(--info)'

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      {kirimErr && (
        <div className="card" style={{ padding: '.6rem .9rem', marginBottom: '.8rem', fontSize: '.88rem',
             color: 'var(--danger)', borderColor: 'color-mix(in srgb, var(--danger) 45%, var(--border))',
             background: 'color-mix(in srgb, var(--danger) 10%, var(--card))' }}>
          ⚠️ {kirimErr}
        </div>
      )}

      {/* Boss + HP bar */}
      <div className="card" style={{ padding: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>
        <div className={flash.includes('HP') ? 'anim-boss' : ''}
             style={{ fontSize: '2.6rem', transition: 'transform .1s' }}>
          {data.emoji}
        </div>
        <div style={{ fontWeight: 700 }}>{data.nama}</div>
        <div className="bar" style={{ marginTop: '.55rem', height: 14 }}>
          <i style={{ width: `${hpPct}%`, background: 'var(--grad-danger)' }} />
        </div>
        <div className="muted" style={{ fontSize: '.8rem', marginTop: 4 }}>
          <Icon name="api" size={12} style={{ verticalAlign: '-1px' }} /> HP {bossHp} / {data.hp}
        </div>
      </div>

      {/* Status: nyawa + timer */}
      <div className="flex items-center justify-between" style={{ marginBottom: '.6rem' }}>
        <span style={{ fontSize: '1.15rem', letterSpacing: '-1px' }}>
          {'❤️'.repeat(Math.max(0, lives))}{'🤍'.repeat(Math.max(0, maxLives - lives))}
        </span>
        <span className="pill" style={{ fontWeight: 700, color: timeColor,
              borderColor: `color-mix(in srgb, ${timeColor} 45%, var(--border))` }}>
          <Icon name="waktu" size={14} /> {timeLeft}s
        </span>
      </div>
      <div className="bar bar-sm" style={{ marginBottom: '1rem' }}>
        <i style={{ width: `${timePct}%`, background: timeColor, transition: 'width 1s linear' }} />
      </div>

      {/* Soal */}
      <div className={'card' + (flash.includes('nyawa') ? ' anim-shake' : '')} style={{ padding: '1.4rem' }}>
        {flash && (
          <div className="anim-pop" style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.3rem',
                        color: flash.includes('HP') ? 'var(--success)' : 'var(--danger)' }}>
            {flash}
          </div>
        )}
        {!flash && (
          <>
            <h2 style={{ marginTop: 0, fontSize: '1.15rem' }}>{question.q}</h2>
            {question.code && <pre className="code" style={{ margin: '1rem 0' }}>{question.code}</pre>}

            {question.tipe === 'mc' && (
              <div className="flex" style={{ flexDirection: 'column', gap: '.55rem', marginTop: '1rem' }}>
                {(question.opts || []).map((opt) => (
                  <button key={opt} className="btn btn-ghost" style={{ textAlign: 'left' }}
                          onClick={() => kirim(opt)}>{opt}</button>
                ))}
              </div>
            )}

            {(question.tipe === 'out' || question.tipe === 'blank') && (
              <form onSubmit={(e) => { e.preventDefault(); if (answer.trim()) kirim(answer) }}
                    style={{ marginTop: '1rem' }}>
                <input className="input" value={answer} autoFocus placeholder="Ketik jawabanmu…"
                       onChange={(e) => setAnswer(e.target.value)} />
                <button className="btn btn-danger" style={{ marginTop: '.8rem' }}
                        disabled={!answer.trim()}>Serang! ⚔️</button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
