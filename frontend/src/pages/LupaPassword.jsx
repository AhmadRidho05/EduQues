import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import Logo from '../components/Logo'
import Icon from '../components/Icon'

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '.4rem',
  fontSize: '.82rem', fontWeight: 600, color: 'var(--text)',
}

export default function LupaPassword() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [passBaru, setPassBaru] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [err, setErr] = useState('')
  const [sukses, setSukses] = useState('')
  const [busy, setBusy] = useState(false)

  async function gantiPassword(e) {
    e.preventDefault(); setErr('')
    if (passBaru !== konfirmasi) {
      setErr('Konfirmasi kata sandi tidak cocok.'); return
    }
    setBusy(true)
    try {
      const { data } = await client.post('/auth/lupa/reset',
        { email, password_baru: passBaru })
      setSukses(data.pesan || 'Kata sandi berhasil diganti.')
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Gagal mengganti kata sandi.')
    } finally { setBusy(false) }
  }

  return (
    <div style={{
      position: 'relative', minHeight: '100vh', display: 'grid',
      placeItems: 'center', padding: '1rem', overflow: 'hidden',
    }}>
      {/* Lingkaran cahaya dekoratif */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-15%', left: '-12%', width: 440, height: 440,
        borderRadius: '50%', background: 'var(--primary)', opacity: .18,
        filter: 'blur(130px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '-16%', right: '-10%', width: 420, height: 420,
        borderRadius: '50%', background: 'var(--accent)', opacity: .15,
        filter: 'blur(130px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="card card-accent fade-in" style={{
        position: 'relative', zIndex: 1, width: 420, maxWidth: '100%',
        padding: '2rem', boxShadow: 'var(--sh-lg)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.9rem' }}>
            <Logo size={44} wordSize="1.5rem" />
          </div>
          <h1 className="grad-text" style={{
            margin: '0 0 .35rem', fontSize: '1.5rem', letterSpacing: '-.02em',
          }}>
            Lupa Kata Sandi
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Atur ulang kata sandimu dalam beberapa detik saja.
          </p>
        </div>

        {err && (
          <div className="card" style={{
            display: 'flex', alignItems: 'flex-start', gap: '.55rem',
            padding: '.7rem .85rem', marginBottom: '1.1rem', fontSize: '.86rem',
            color: 'var(--danger)',
            borderColor: 'color-mix(in srgb, var(--danger) 45%, transparent)',
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
          }}>
            <Icon name="info" size={16} style={{ marginTop: '.1rem' }} />
            <span>{err}</span>
          </div>
        )}

        {sukses ? (
          <div className="fade-in" style={{ textAlign: 'center' }}>
            <div className="empty-ico" style={{
              color: 'var(--success)',
              borderColor: 'color-mix(in srgb, var(--success) 45%, transparent)',
              background: 'color-mix(in srgb, var(--success) 12%, transparent)',
            }}>
              <Icon name="cek" size={26} stroke={2.4} />
            </div>
            <h2 style={{
              margin: '0 0 .35rem', fontSize: '1.1rem', fontWeight: 800,
              color: 'var(--success)',
            }}>
              Berhasil!
            </h2>
            <p className="muted" style={{ margin: '0 0 1.3rem', fontSize: '.88rem' }}>
              {sukses}
            </p>
            <button className="btn btn-primary" onClick={() => nav('/login')} style={{
              width: '100%', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', gap: '.45rem',
            }}>
              Masuk Sekarang
              <Icon name="kanan" size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={gantiPassword}>
            <label style={labelStyle}>
              <Icon name="dokumen" size={15} /> Email
            </label>
            <input className="input" type="email" value={email} required autoFocus
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="nama@kampus.ac.id" style={{ margin: '.4rem 0 1rem' }} />

            <label style={labelStyle}>
              <Icon name="kunci" size={15} /> Kata sandi baru
            </label>
            <input className="input" type="password" value={passBaru} required minLength={6}
                   autoComplete="new-password" onChange={(e) => setPassBaru(e.target.value)}
                   placeholder="••••••••" style={{ margin: '.4rem 0 .35rem' }} />
            <p className="muted" style={{ margin: '0 0 1rem', fontSize: '.76rem' }}>
              Minimal 6 karakter.
            </p>

            <label style={labelStyle}>
              <Icon name="kunci" size={15} /> Konfirmasi kata sandi baru
            </label>
            <input className="input" type="password" value={konfirmasi} required minLength={6}
                   autoComplete="new-password" onChange={(e) => setKonfirmasi(e.target.value)}
                   placeholder="Ulangi kata sandi baru" style={{ margin: '.4rem 0 1.5rem' }} />

            <button className="btn btn-primary" disabled={busy} style={{
              width: '100%', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', gap: '.45rem',
            }}>
              {busy ? 'Menyimpan…' : 'Ganti Kata Sandi'}
              <Icon name="kanan" size={16} />
            </button>
          </form>
        )}

        <div style={{
          marginTop: '1.4rem', paddingTop: '1.1rem',
          borderTop: '1px solid var(--border-soft)', textAlign: 'center',
        }}>
          <p className="muted" style={{ margin: 0, fontSize: '.86rem' }}>
            Ingat kata sandimu? <Link to="/login">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
