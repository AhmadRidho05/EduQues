import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const STATUS = {
  belum_dibuka: '🔒 Belum dibuka', berlangsung: '🟢 Sedang dibuka', ditutup: '⛔ Ditutup',
}

export default function KelolaTes() {
  const { user } = useAuth()
  const [tes, setTes] = useState([])
  const [form, setForm] = useState({ judul: '', jumlah_soal: 10, waktu_mulai: '', waktu_selesai: '' })
  const [msg, setMsg] = useState('')
  const [hasil, setHasil] = useState(null)  // {tid, judul, rows}

  useEffect(() => { muat() }, [])
  function muat() { client.get('/tes').then((r) => setTes(r.data)).catch(() => {}) }
  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function buat(e) {
    e.preventDefault(); setMsg('')
    if (!form.judul.trim() || !form.waktu_mulai || !form.waktu_selesai) {
      setMsg('❌ Judul & waktu wajib diisi.'); return
    }
    try {
      await client.post('/tes', { ...form, jumlah_soal: Number(form.jumlah_soal) })
      setForm({ judul: '', jumlah_soal: 10, waktu_mulai: '', waktu_selesai: '' })
      setMsg('✅ Tes dibuat.'); muat()
    } catch (e2) { setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal.')) }
  }

  async function hapus(t) {
    if (!window.confirm(`Hapus tes "${t.judul}"?`)) return
    await client.delete(`/tes/${t.id}`)
    if (hasil?.tid === t.id) setHasil(null)
    muat()
  }

  async function lihatHasil(t) {
    const { data } = await client.get(`/tes/${t.id}/hasil`)
    setHasil({ tid: t.id, judul: data.judul, rows: data.hasil })
  }

  if (user?.role !== 'dosen') return <p className="muted">Halaman ini khusus dosen.</p>

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>🗓️ Kelola Tes</h1>

      <form onSubmit={buat} className="card" style={{ padding: '1.3rem', marginTop: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>➕ Buat Tes Terjadwal</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.7rem' }}>
          <div><label style={{ fontSize: '.8rem' }}>Judul</label>
            <input className="input" style={{ marginTop: 4 }} value={form.judul} onChange={setF('judul')} placeholder="Tes Harian - Variabel" /></div>
          <div><label style={{ fontSize: '.8rem' }}>Jumlah soal (acak dari bank)</label>
            <input className="input" type="number" min="1" style={{ marginTop: 4 }} value={form.jumlah_soal} onChange={setF('jumlah_soal')} /></div>
          <div><label style={{ fontSize: '.8rem' }}>Waktu mulai</label>
            <input className="input" type="datetime-local" style={{ marginTop: 4 }} value={form.waktu_mulai} onChange={setF('waktu_mulai')} /></div>
          <div><label style={{ fontSize: '.8rem' }}>Waktu selesai</label>
            <input className="input" type="datetime-local" style={{ marginTop: 4 }} value={form.waktu_selesai} onChange={setF('waktu_selesai')} /></div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: '.9rem' }}>Buat Tes</button>
        {msg && <span style={{ marginLeft: '.8rem', fontSize: '.85rem' }}>{msg}</span>}
      </form>

      <h2 style={{ fontSize: '1.15rem', marginTop: '1.8rem' }}>Daftar Tes ({tes.length})</h2>
      {tes.length === 0 && <p className="muted">Belum ada tes.</p>}
      <div style={{ display: 'grid', gap: '.7rem' }}>
        {tes.map((t) => (
          <div key={t.id} className="card flex items-center justify-between"
               style={{ padding: '.9rem 1.2rem', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <b>{t.judul}</b> <span className="muted" style={{ fontSize: '.8rem' }}>· {STATUS[t.status]}</span>
              <div className="muted" style={{ fontSize: '.78rem' }}>
                {t.jumlah_soal} soal · {t.mulai} → {t.selesai} · {t.peserta_selesai} peserta selesai
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" style={{ padding: '.35rem .7rem', fontSize: '.82rem' }}
                      onClick={() => lihatHasil(t)}>Hasil</button>
              <button className="btn btn-ghost" style={{ padding: '.35rem .7rem', fontSize: '.82rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                      onClick={() => hapus(t)}>Hapus</button>
            </div>
          </div>
        ))}
      </div>

      {hasil && (
        <div className="card" style={{ padding: '1.3rem', marginTop: '1.4rem' }}>
          <div className="flex items-center justify-between">
            <h3 style={{ margin: 0 }}>Hasil: {hasil.judul}</h3>
            <button className="btn btn-ghost" style={{ padding: '.3rem .7rem', fontSize: '.8rem' }} onClick={() => setHasil(null)}>Tutup</button>
          </div>
          {hasil.rows.length === 0 ? (
            <p className="muted" style={{ marginBottom: 0 }}>Belum ada yang mengerjakan.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '.6rem', fontSize: '.9rem' }}>
              <thead><tr style={{ textAlign: 'left', color: 'var(--subtext)', fontSize: '.8rem' }}>
                <th style={{ padding: '.3rem 0' }}>Mahasiswa</th><th>Nilai</th><th>Benar</th><th>Status</th></tr></thead>
              <tbody>
                {hasil.rows.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '.45rem 0' }}>{r.nama}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{r.nilai}</td>
                    <td>{r.benar}/{r.total}</td>
                    <td style={{ color: r.selesai ? 'var(--success)' : 'var(--subtext)' }}>{r.selesai ? '✅ Selesai' : 'Belum'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
