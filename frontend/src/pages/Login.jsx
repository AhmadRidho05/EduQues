import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import Icon from '../components/Icon'

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '.4rem',
  fontSize: '.82rem', fontWeight: 600, color: 'var(--text)',
}

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const u = await login(email, password)
      nav(u.role === 'dosen' ? '/dosen' : '/peta')
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Gagal login. Cek koneksi ke server.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      position: 'relative', minHeight: '100vh', display: 'grid',
      placeItems: 'center', padding: '1rem', overflow: 'hidden',
    }}>
      {/* Lingkaran cahaya dekoratif */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-14%', left: '-10%', width: 460, height: 460,
        borderRadius: '50%', background: 'var(--primary)', opacity: .18,
        filter: 'blur(130px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '-18%', right: '-12%', width: 420, height: 420,
        borderRadius: '50%', background: 'var(--accent)', opacity: .15,
        filter: 'blur(130px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <form onSubmit={submit} className="card card-accent fade-in" style={{
        position: 'relative', zIndex: 1, width: 420, maxWidth: '100%',
        padding: '2rem', boxShadow: 'var(--sh-lg)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.9rem' }}>
            <Logo size={44} wordSize="1.5rem" />
          </div>
          <h1 className="grad-text" style={{
            margin: '0 0 .35rem', fontSize: '1.5rem', letterSpacing: '-.02em',
          }}>
            Selamat Datang
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Masuk untuk melanjutkan petualangan belajarmu.
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

        <label style={labelStyle}>
          <Icon name="dokumen" size={15} /> Email
        </label>
        <input className="input" type="email" value={email} required
               onChange={(e) => setEmail(e.target.value)}
               placeholder="nama@kampus.ac.id" style={{ margin: '.4rem 0 1.1rem' }} />

        <label style={labelStyle}>
          <Icon name="kunci" size={15} /> Kata sandi
        </label>
        <input className="input" type="password" value={password} required
               onChange={(e) => setPassword(e.target.value)}
               placeholder="••••••••" style={{ margin: '.4rem 0 1.6rem' }} />

        <button className="btn btn-primary" disabled={busy} style={{
          width: '100%', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', gap: '.45rem',
        }}>
          {busy ? 'Memproses…' : 'Masuk'}
          <Icon name="kanan" size={16} />
        </button>

        <div style={{
          marginTop: '1.4rem', paddingTop: '1.1rem',
          borderTop: '1px solid var(--border-soft)', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 .5rem', fontSize: '.86rem' }}>
            <Link to="/lupa-password" style={{
              display: 'inline-flex', alignItems: 'center', gap: '.35rem',
            }}>
              <Icon name="kunci" size={14} /> Lupa kata sandi?
            </Link>
          </p>
          <p className="muted" style={{ margin: 0, fontSize: '.86rem' }}>
            Belum punya akun? <Link to="/register">Daftar di sini</Link>
          </p>
        </div>
      </form>
    </div>
  )
}
