import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import Logo from '../components/Logo'

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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: 400, maxWidth: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.5rem' }}>
            <Logo size={44} wordSize="1.5rem" />
          </div>
          <h1 style={{ margin: '.3rem 0', fontSize: '1.15rem' }}>🔑 Lupa Kata Sandi</h1>
        </div>

        {err && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '.6rem .8rem',
                        borderRadius: 10, marginBottom: '1rem', fontSize: '.86rem' }}>{err}</div>
        )}

        {sukses ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>✅</div>
            <p style={{ color: 'var(--success)', fontWeight: 700 }}>{sukses}</p>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '.5rem' }}
                    onClick={() => nav('/login')}>Masuk Sekarang</button>
          </div>
        ) : (
          <form onSubmit={gantiPassword}>
            <p className="muted" style={{ marginTop: 0, fontSize: '.88rem' }}>
              Masukkan email akunmu dan kata sandi barunya.
            </p>

            <label style={{ fontSize: '.85rem' }}>Email</label>
            <input className="input" type="email" value={email} required autoFocus
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="nama@kampus.ac.id" style={{ margin: '.3rem 0 1rem' }} />

            <label style={{ fontSize: '.85rem' }}>Kata sandi baru (min. 6 karakter)</label>
            <input className="input" type="password" value={passBaru} required minLength={6}
                   autoComplete="new-password" onChange={(e) => setPassBaru(e.target.value)}
                   placeholder="••••••••" style={{ margin: '.3rem 0 1rem' }} />

            <label style={{ fontSize: '.85rem' }}>Konfirmasi kata sandi baru</label>
            <input className="input" type="password" value={konfirmasi} required minLength={6}
                   autoComplete="new-password" onChange={(e) => setKonfirmasi(e.target.value)}
                   placeholder="Ulangi kata sandi baru" style={{ margin: '.3rem 0 1.2rem' }} />

            <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Menyimpan…' : 'Ganti Kata Sandi'}
            </button>
          </form>
        )}

        <p className="muted" style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '.86rem' }}>
          Ingat kata sandimu? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
