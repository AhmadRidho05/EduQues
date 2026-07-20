import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import Logo from '../components/Logo'

export default function LupaPassword() {
  const nav = useNavigate()
  const [langkah, setLangkah] = useState(1)
  const [email, setEmail] = useState('')
  const [info, setInfo] = useState(null)      // {nama, pertanyaan}
  const [jawaban, setJawaban] = useState('')
  const [passBaru, setPassBaru] = useState('')
  const [err, setErr] = useState('')
  const [sukses, setSukses] = useState('')
  const [busy, setBusy] = useState(false)

  async function cariPertanyaan(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const { data } = await client.post('/auth/lupa/pertanyaan', { email })
      setInfo(data); setLangkah(2)
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Gagal memproses.')
    } finally { setBusy(false) }
  }

  async function gantiPassword(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const { data } = await client.post('/auth/lupa/reset',
        { email, jawaban, password_baru: passBaru })
      setSukses(data.pesan || 'Password berhasil diganti.')
      setLangkah(3)
    } catch (e2) {
      setErr(e2?.response?.data?.detail || 'Gagal mengganti password.')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: 400, maxWidth: '100%', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '.5rem' }}>
            <Logo size={44} wordSize="1.5rem" />
          </div>
          <h1 style={{ margin: '.3rem 0', fontSize: '1.15rem' }}>🔑 Lupa Password</h1>
        </div>

        {err && (
          <div style={{ background: 'var(--danger)', color: '#fff', padding: '.6rem .8rem',
                        borderRadius: 10, marginBottom: '1rem', fontSize: '.86rem' }}>{err}</div>
        )}

        {/* Langkah 1 — cari akun */}
        {langkah === 1 && (
          <form onSubmit={cariPertanyaan}>
            <p className="muted" style={{ marginTop: 0, fontSize: '.88rem' }}>
              Masukkan email akunmu. Nanti muncul pertanyaan keamanan yang kamu atur.
            </p>
            <label style={{ fontSize: '.85rem' }}>Email</label>
            <input className="input" type="email" value={email} required autoFocus
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="nama@kampus.ac.id" style={{ margin: '.3rem 0 1.2rem' }} />
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Mencari…' : 'Lanjut'}
            </button>
          </form>
        )}

        {/* Langkah 2 — jawab + password baru */}
        {langkah === 2 && info && (
          <form onSubmit={gantiPassword}>
            <p className="muted" style={{ marginTop: 0, fontSize: '.88rem' }}>
              Halo <b style={{ color: 'var(--text)' }}>{info.nama}</b>, jawab pertanyaan ini:
            </p>
            <div className="card" style={{ padding: '.8rem 1rem', margin: '.6rem 0 1rem',
                                           background: 'var(--bg)', fontWeight: 600 }}>
              {info.pertanyaan}
            </div>
            <label style={{ fontSize: '.85rem' }}>Jawaban</label>
            <input className="input" value={jawaban} required autoFocus
                   onChange={(e) => setJawaban(e.target.value)}
                   placeholder="Jawabanmu" style={{ margin: '.3rem 0 1rem' }} />
            <label style={{ fontSize: '.85rem' }}>Password baru (min. 6 karakter)</label>
            <input className="input" type="password" value={passBaru} required minLength={6}
                   onChange={(e) => setPassBaru(e.target.value)}
                   placeholder="••••••••" style={{ margin: '.3rem 0 1.2rem' }} />
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Menyimpan…' : 'Ganti Password'}
            </button>
            <button type="button" className="btn btn-ghost" style={{ width: '100%', marginTop: '.6rem' }}
                    onClick={() => { setLangkah(1); setErr('') }}>← Ganti email</button>
          </form>
        )}

        {/* Langkah 3 — berhasil */}
        {langkah === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem' }}>✅</div>
            <p style={{ color: 'var(--success)', fontWeight: 700 }}>{sukses}</p>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '.5rem' }}
                    onClick={() => nav('/login')}>Masuk Sekarang</button>
          </div>
        )}

        <p className="muted" style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '.86rem' }}>
          Ingat passwordmu? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  )
}
