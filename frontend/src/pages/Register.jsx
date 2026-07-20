import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'mahasiswa' })
  const [konfirmasi, setKonfirmasi] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setErr('')
    if (form.password !== konfirmasi) {
      setErr('Konfirmasi kata sandi tidak cocok.'); return
    }
    setBusy(true)
    try {
      const u = await register(form)
      nav(u.role === 'dosen' ? '/dosen' : '/peta')
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Gagal mendaftar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <form onSubmit={submit} className="card" style={{ width: 400, maxWidth: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.4rem' }}>
            <Logo size={44} wordSize="1.5rem" />
          </div>
          <h1 style={{ margin: '.3rem 0', fontSize: '1.15rem' }}>Daftar Akun</h1>
        </div>

        {err && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '.6rem .8rem',
                        borderRadius: 10, marginBottom: '1rem', fontSize: '.88rem' }}>
            {err}
          </div>
        )}

        <label style={{ fontSize: '.85rem' }}>Nama lengkap</label>
        <input className="input" value={form.nama} required onChange={set('nama')}
               placeholder="Nama kamu" style={{ margin: '.3rem 0 1rem' }} />

        <label style={{ fontSize: '.85rem' }}>Email</label>
        <input className="input" type="email" value={form.email} required onChange={set('email')}
               placeholder="nama@kampus.ac.id" style={{ margin: '.3rem 0 1rem' }} />

        <label style={{ fontSize: '.85rem' }}>Kata sandi</label>
        <input className="input" type="password" value={form.password} required minLength={6}
               autoComplete="new-password" onChange={set('password')}
               placeholder="Minimal 6 karakter" style={{ margin: '.3rem 0 1rem' }} />

        <label style={{ fontSize: '.85rem' }}>Konfirmasi kata sandi</label>
        <input className="input" type="password" value={konfirmasi} required minLength={6}
               autoComplete="new-password" onChange={(e) => setKonfirmasi(e.target.value)}
               placeholder="Ulangi kata sandi" style={{ margin: '.3rem 0 1rem' }} />

        <label style={{ fontSize: '.85rem' }}>Daftar sebagai</label>
        <select className="input" value={form.role} onChange={set('role')}
                style={{ margin: '.3rem 0 1.5rem' }}>
          <option value="mahasiswa">🎓 Mahasiswa (bermain & belajar)</option>
          <option value="dosen">👨‍🏫 Dosen (kelola soal)</option>
        </select>

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Memproses…' : 'Daftar'}
        </button>

        <p className="muted" style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '.88rem' }}>
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </form>
    </div>
  )
}
