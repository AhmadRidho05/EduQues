import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import Icon from '../components/Icon'

const labelStyle = {
  display: 'flex', alignItems: 'center', gap: '.4rem',
  fontSize: '.82rem', fontWeight: 600, color: 'var(--text)',
}

const PERAN = [
  { nilai: 'mahasiswa', ikon: 'kelas', judul: 'Mahasiswa', ket: 'Bermain & belajar' },
  { nilai: 'dosen', ikon: 'dasbor', judul: 'Dosen', ket: 'Kelola soal & kelas' },
]

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
    <div style={{
      position: 'relative', minHeight: '100vh', display: 'grid',
      placeItems: 'center', padding: '1rem', overflow: 'hidden',
    }}>
      {/* Lingkaran cahaya dekoratif */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-16%', right: '-10%', width: 460, height: 460,
        borderRadius: '50%', background: 'var(--primary)', opacity: .18,
        filter: 'blur(130px)', pointerEvents: 'none', zIndex: 0,
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '-18%', left: '-12%', width: 420, height: 420,
        borderRadius: '50%', background: 'var(--accent)', opacity: .15,
        filter: 'blur(130px)', pointerEvents: 'none', zIndex: 0,
      }} />

      <form onSubmit={submit} className="card card-accent fade-in" style={{
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
            Daftar Akun
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Buat akun gratis dan mulai perjalanan belajarmu.
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
          <Icon name="profil" size={15} /> Nama lengkap
        </label>
        <input className="input" value={form.nama} required onChange={set('nama')}
               placeholder="Nama kamu" style={{ margin: '.4rem 0 1rem' }} />

        <label style={labelStyle}>
          <Icon name="dokumen" size={15} /> Email
        </label>
        <input className="input" type="email" value={form.email} required onChange={set('email')}
               placeholder="nama@kampus.ac.id" style={{ margin: '.4rem 0 1rem' }} />

        <label style={labelStyle}>
          <Icon name="kunci" size={15} /> Kata sandi
        </label>
        <input className="input" type="password" value={form.password} required minLength={6}
               autoComplete="new-password" onChange={set('password')}
               placeholder="Minimal 6 karakter" style={{ margin: '.4rem 0 1rem' }} />

        <label style={labelStyle}>
          <Icon name="kunci" size={15} /> Konfirmasi kata sandi
        </label>
        <input className="input" type="password" value={konfirmasi} required minLength={6}
               autoComplete="new-password" onChange={(e) => setKonfirmasi(e.target.value)}
               placeholder="Ulangi kata sandi" style={{ margin: '.4rem 0 1.1rem' }} />

        <label style={labelStyle}>
          <Icon name="kelas" size={15} /> Daftar sebagai
        </label>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem',
          margin: '.5rem 0 1.5rem',
        }}>
          {PERAN.map((p) => {
            const aktif = form.role === p.nilai
            return (
              <button
                key={p.nilai}
                type="button"
                aria-pressed={aktif}
                onClick={() => setForm({ ...form, role: p.nilai })}
                style={{
                  position: 'relative', textAlign: 'left', cursor: 'pointer',
                  padding: '.85rem .8rem', borderRadius: 'var(--r-lg)',
                  border: `1px solid ${aktif ? 'var(--primary)' : 'var(--border)'}`,
                  background: aktif
                    ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                    : 'var(--bg-soft)',
                  color: 'var(--text)', font: 'inherit',
                  boxShadow: aktif ? 'var(--sh-glow)' : 'none',
                  transition: 'border-color .15s, background .15s, box-shadow .15s',
                }}
              >
                {aktif && (
                  <span style={{
                    position: 'absolute', top: '.5rem', right: '.5rem',
                    display: 'grid', placeItems: 'center',
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--primary)', color: '#fff',
                  }}>
                    <Icon name="cek" size={11} stroke={2.6} />
                  </span>
                )}
                <Icon name={p.ikon} size={20}
                      style={{ color: aktif ? 'var(--primary)' : 'var(--subtext)' }} />
                <div style={{ fontWeight: 700, fontSize: '.9rem', marginTop: '.4rem' }}>
                  {p.judul}
                </div>
                <div className="muted" style={{ fontSize: '.76rem', marginTop: '.1rem' }}>
                  {p.ket}
                </div>
              </button>
            )
          })}
        </div>

        <button className="btn btn-primary" disabled={busy} style={{
          width: '100%', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', gap: '.45rem',
        }}>
          {busy ? 'Memproses…' : 'Daftar'}
          <Icon name="kanan" size={16} />
        </button>

        <div style={{
          marginTop: '1.4rem', paddingTop: '1.1rem',
          borderTop: '1px solid var(--border-soft)', textAlign: 'center',
        }}>
          <p className="muted" style={{ margin: 0, fontSize: '.86rem' }}>
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </p>
        </div>
      </form>
    </div>
  )
}
