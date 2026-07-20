import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

// Bagian "Kelas" di halaman Profil: pilih/masuk kelas, gabung (mahasiswa),
// atau buat kelas (dosen). Menu fitur lain baru terbuka setelah masuk kelas.
export default function KelasSection() {
  const { user } = useAuth()
  const nav = useNavigate()
  const dosen = user?.role === 'dosen'

  const [kelas, setKelas] = useState([])
  const [aktif, setAktif] = useState(null)
  const [msg, setMsg] = useState('')
  const [buka, setBuka] = useState(false)   // buka form buat/gabung
  const [form, setForm] = useState({
    matkul: '', kampus: '', prodi: '', semester: '', kelas_label: '', pakai_template: false,
  })
  const [kode, setKode] = useState('')

  useEffect(() => { muat() }, [])
  function muat() {
    client.get('/kelas/saya').then((r) => setKelas(r.data)).catch(() => {})
    client.get('/kelas/aktif').then((r) => setAktif(r.data.aktif ? r.data : null)).catch(() => {})
  }
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function buat(e) {
    e.preventDefault(); setMsg('')
    if (!form.matkul.trim()) { setMsg('❌ Nama mata pelajaran wajib diisi.'); return }
    try {
      await client.post('/kelas', form)
      setForm({ matkul: '', kampus: '', prodi: '', semester: '', kelas_label: '', pakai_template: false })
      setBuka(false); setMsg('✅ Kelas dibuat. Isi babnya lewat "Kelola Soal".'); muat()
    } catch (e2) { setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal membuat kelas.')) }
  }

  async function gabung(e) {
    e.preventDefault(); setMsg('')
    try {
      const { data } = await client.post('/kelas/gabung', { kode })
      setKode(''); setBuka(false); setMsg(`✅ Berhasil gabung "${data.matkul}".`); muat()
    } catch (e2) { setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal gabung.')) }
  }

  async function masuk(k) {
    try {
      await client.post(`/kelas/${k.id}/masuk`)
      nav(dosen ? '/dosen' : '/peta')
    } catch (e2) { setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal masuk kelas.')) }
  }

  async function keluarHapus(k) {
    const p = dosen ? `Hapus kelas "${k.matkul}"?` : `Keluar dari kelas "${k.matkul}"?`
    if (!window.confirm(p)) return
    await client.delete(`/kelas/${k.id}`); muat()
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '.6rem' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>🎓 Kelas Saya</h2>
        <button className="btn btn-primary" style={{ padding: '.45rem 1rem', fontSize: '.88rem' }}
                onClick={() => setBuka(!buka)}>
          {buka ? 'Tutup' : (dosen ? '➕ Buat Kelas' : '➕ Gabung Kelas')}
        </button>
      </div>
      <p className="muted" style={{ fontSize: '.83rem', marginTop: '.3rem' }}>
        Pilih kelas dulu — menu lainnya baru terbuka setelah kamu masuk ke sebuah kelas.
      </p>

      {/* Form buat / gabung */}
      {buka && (dosen ? (
        <form onSubmit={buat} className="card" style={{ padding: '1.2rem', marginTop: '.8rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '.7rem' }}>
            <div><label style={{ fontSize: '.8rem' }}>Mata pelajaran *</label>
              <input className="input" style={{ marginTop: 4 }} value={form.matkul} onChange={setF('matkul')} placeholder="mis. IPS" /></div>
            <div><label style={{ fontSize: '.8rem' }}>Kampus/Sekolah</label>
              <input className="input" style={{ marginTop: 4 }} value={form.kampus} onChange={setF('kampus')} /></div>
            <div><label style={{ fontSize: '.8rem' }}>Prodi/Jurusan</label>
              <input className="input" style={{ marginTop: 4 }} value={form.prodi} onChange={setF('prodi')} /></div>
            <div><label style={{ fontSize: '.8rem' }}>Semester</label>
              <input className="input" style={{ marginTop: 4 }} value={form.semester} onChange={setF('semester')} /></div>
            <div><label style={{ fontSize: '.8rem' }}>Kelas</label>
              <input className="input" style={{ marginTop: 4 }} value={form.kelas_label} onChange={setF('kelas_label')} placeholder="TI-3A" /></div>
          </div>
          <label className="flex items-center gap-2" style={{ marginTop: '.9rem', fontSize: '.83rem' }}>
            <input type="checkbox" checked={form.pakai_template}
                   onChange={(e) => setForm({ ...form, pakai_template: e.target.checked })} />
            Isi dengan contoh kurikulum <b>Python</b> (buat kelas pemrograman)
          </label>
          <p className="muted" style={{ fontSize: '.76rem', margin: '.35rem 0 0' }}>
            Kalau tidak dicentang, kelas dibuat <b>kosong</b> (10 bab tanpa soal) — kamu isi sendiri.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '.9rem' }}>Buat Kelas</button>
        </form>
      ) : (
        <form onSubmit={gabung} className="card" style={{ padding: '1.2rem', marginTop: '.8rem' }}>
          <p className="muted" style={{ marginTop: 0, fontSize: '.85rem' }}>Minta kode kelas ke gurumu.</p>
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            <input className="input" style={{ maxWidth: 200, textTransform: 'uppercase' }}
                   value={kode} onChange={(e) => setKode(e.target.value)} placeholder="mis. GK1NWK" />
            <button className="btn btn-primary" disabled={!kode.trim()}>Gabung</button>
          </div>
        </form>
      ))}

      {msg && <p style={{ marginTop: '.8rem', fontSize: '.88rem' }}>{msg}</p>}

      {kelas.length === 0 && (
        <div className="card" style={{ padding: '1.8rem', textAlign: 'center', marginTop: '.8rem' }}>
          <div style={{ fontSize: '2rem' }}>👋</div>
          <p className="muted" style={{ margin: 0 }}>
            {dosen ? 'Belum ada kelas. Klik "Buat Kelas" di atas.'
                   : 'Belum gabung kelas. Klik "Gabung Kelas" dan masukkan kode dari gurumu.'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                    gap: '.9rem', marginTop: '.8rem' }}>
        {kelas.map((k) => {
          const ini = aktif && aktif.id === k.id
          return (
            <div key={k.id} className="card" style={{
              padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.45rem',
              borderColor: ini ? 'var(--primary)' : 'var(--border)',
            }}>
              <div className="flex items-center justify-between">
                <span style={{ fontWeight: 700 }}>{k.matkul}</span>
                {ini && <span style={{ fontSize: '.68rem', color: 'var(--primary)', fontWeight: 700 }}>● AKTIF</span>}
              </div>
              <div className="muted" style={{ fontSize: '.78rem' }}>
                {[k.kelas_label, k.prodi, k.kampus].filter(Boolean).join(' · ') || '—'}
              </div>
              {dosen ? (
                <div style={{ fontSize: '.82rem' }}>
                  Kode: <b style={{ fontFamily: 'Consolas, monospace', color: 'var(--primary)', letterSpacing: 1 }}>{k.kode}</b>
                  <span className="muted"> · {k.jumlah_anggota} anggota</span>
                </div>
              ) : (
                <div className="muted" style={{ fontSize: '.82rem' }}>👨‍🏫 {k.dosen}</div>
              )}
              <div className="flex gap-2" style={{ marginTop: 'auto', paddingTop: '.4rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, padding: '.42rem' }}
                        onClick={() => masuk(k)}>{ini ? 'Lanjut →' : 'Masuk →'}</button>
                <button className="btn btn-ghost" style={{ padding: '.42rem .7rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        onClick={() => keluarHapus(k)}>{dosen ? 'Hapus' : 'Keluar'}</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
