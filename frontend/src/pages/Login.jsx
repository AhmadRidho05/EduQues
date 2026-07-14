import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <form onSubmit={submit} className="card" style={{ width: 380, maxWidth: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🐍</div>
          <h1 style={{ margin: '.3rem 0', fontSize: '1.5rem' }}>PyQuest</h1>
          <p className="muted" style={{ margin: 0, fontSize: '.9rem' }}>Masuk untuk melanjutkan petualangan</p>
        </div>

        {err && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '.6rem .8rem',
                        borderRadius: 10, marginBottom: '1rem', fontSize: '.88rem' }}>
            {err}
          </div>
        )}

        <label style={{ fontSize: '.85rem' }}>Email</label>
        <input className="input" type="email" value={email} required
               onChange={(e) => setEmail(e.target.value)}
               placeholder="nama@kampus.ac.id" style={{ margin: '.3rem 0 1rem' }} />

        <label style={{ fontSize: '.85rem' }}>Password</label>
        <input className="input" type="password" value={password} required
               onChange={(e) => setPassword(e.target.value)}
               placeholder="••••••••" style={{ margin: '.3rem 0 1.5rem' }} />

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Memproses…' : 'Masuk'}
        </button>

        <p className="muted" style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '.88rem' }}>
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </form>
    </div>
  )
}
