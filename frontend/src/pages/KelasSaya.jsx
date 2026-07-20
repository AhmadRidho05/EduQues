import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function KelasSaya() {
  const { user } = useAuth()
  const nav = useNavigate()
  const dosen = user?.role === 'dosen'

  const [kelas, setKelas] = useState([])
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ matkul: '', kampus: '', prodi: '', semester: '', kelas_label: '' })
  const [kode, setKode] = useState('')

  useEffect(() => { muat() }, [])
  function muat() { client.get('/kelas/saya').then((r) => setKelas(r.data)).catch(() => {}) }
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function buat(e) {
    e.preventDefault(); setMsg('')
    if (!form.matkul.trim()) { setMsg('❌ Nama matkul wajib diisi.'); return }
    try {
      await client.post('/kelas', form)
      setForm({ matkul: '', kampus: '', prodi: '', semester: '', kelas_label: '' })
      setMsg('✅ Kelas berhasil dibuat.'); muat()
    } catch (e2) { setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal membuat kelas.')) }
  }

  async function gabung(e) {
    e.preventDefault(); setMsg('')
    try {
      const { data } = await client.post('/kelas/gabung', { kode })
      setKode(''); setMsg(`✅ Berhasil gabung "${data.matkul}".`); muat()
    } catch (e2) { setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal gabung.')) }
  }

  async function masukKelas(k) {
    try {
      await client.post(`/kelas/${k.id}/masuk`)
      nav(dosen ? '/dosen' : '/peta')
    } catch (e2) { setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal masuk kelas.')) }
  }

  async function keluarHapus(k) {
    const p = dosen ? `Hapus kelas "${k.matkul}"? Semua anggota akan dikeluarkan.` : `Keluar dari kelas "${k.matkul}"?`
    if (!window.confirm(p)) return
    await client.delete(`/kelas/${k.id}`); muat()
  }

  const inp = { marginTop: 4 }

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>🎓 Kelas Saya</h1>

      {/* Dosen: buat kelas | Mahasiswa: gabung kelas */}
      {dosen ? (
        <form onSubmit={buat} className="card" style={{ padding: '1.3rem', marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>➕ Buat Kelas Baru</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '.7rem' }}>
            <div><label style={{ fontSize: '.8rem' }}>Mata kuliah *</label>
              <input className="input" style={inp} value={form.matkul} onChange={setF('matkul')} placeholder="Pemrograman Dasar" /></div>
            <div><label style={{ fontSize: '.8rem' }}>Kampus</label>
              <input className="input" style={inp} value={form.kampus} onChange={setF('kampus')} placeholder="Univ. Nusantara" /></div>
            <div><label style={{ fontSize: '.8rem' }}>Prodi</label>
              <input className="input" style={inp} value={form.prodi} onChange={setF('prodi')} placeholder="Teknik Informatika" /></div>
            <div><label style={{ fontSize: '.8rem' }}>Semester</label>
              <input className="input" style={inp} value={form.semester} onChange={setF('semester')} placeholder="3" /></div>
            <div><label style={{ fontSize: '.8rem' }}>Kelas</label>
              <input className="input" style={inp} value={form.kelas_label} onChange={setF('kelas_label')} placeholder="TI-3A" /></div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: '.9rem' }}>Buat Kelas</button>
        </form>
      ) : (
        <form onSubmit={gabung} className="card" style={{ padding: '1.3rem', marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>➕ Gabung Kelas</h3>
          <p className="muted" style={{ marginTop: 0, fontSize: '.85rem' }}>Minta kode kelas ke dosenmu, lalu masukkan di sini.</p>
          <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
            <input className="input" style={{ maxWidth: 220, textTransform: 'uppercase' }}
                   value={kode} onChange={(e) => setKode(e.target.value)} placeholder="mis. GK1NWK" />
            <button className="btn btn-primary" disabled={!kode.trim()}>Gabung</button>
          </div>
        </form>
      )}

      {msg && <p style={{ marginTop: '.8rem' }}>{msg}</p>}

      {/* Daftar kelas */}
      <h2 style={{ fontSize: '1.15rem', marginTop: '1.8rem' }}>
        {dosen ? 'Kelas yang kamu ajar' : 'Kelas yang kamu ikuti'} ({kelas.length})
      </h2>

      {kelas.length === 0 && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginTop: '.6rem' }}>
          <div style={{ fontSize: '2.5rem' }}>👋</div>
          <p className="muted">
            {dosen ? 'Belum ada kelas. Buat kelas pertamamu di atas.'
                   : 'Belum gabung kelas manapun. Masukkan kode dari dosenmu di atas.'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '.6rem' }}>
        {kelas.map((k) => (
          <div key={k.id} className="card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{k.matkul}</div>
            <div className="muted" style={{ fontSize: '.8rem' }}>
              {[k.kelas_label, k.prodi, k.kampus].filter(Boolean).join(' · ') || '—'}
              {k.semester && ` · Smt ${k.semester}`}
            </div>
            {dosen ? (
              <div style={{ fontSize: '.85rem' }}>
                Kode: <b style={{ fontFamily: 'Consolas, monospace', color: 'var(--primary)', letterSpacing: 1 }}>{k.kode}</b>
                <span className="muted"> · {k.jumlah_anggota} anggota</span>
              </div>
            ) : (
              <div className="muted" style={{ fontSize: '.85rem' }}>👨‍🏫 {k.dosen}</div>
            )}
            <div className="flex gap-2" style={{ marginTop: 'auto', paddingTop: '.4rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '.45rem' }}
                      onClick={() => masukKelas(k)}>Masuk →</button>
              <button className="btn btn-ghost" style={{ padding: '.45rem .7rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => keluarHapus(k)}>{dosen ? 'Hapus' : 'Keluar'}</button>
            </div>
          </div>
        ))}
      </div>

      <p className="muted" style={{ fontSize: '.78rem', marginTop: '1.4rem' }}>
        ℹ️ Tahap 1: kelas & keanggotaan. Penyaringan konten per kelas (soal/materi/tes khusus kelas) menyusul di tahap berikutnya.
      </p>
    </div>
  )
}
