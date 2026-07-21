import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

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
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { muat() }, [])
  function muat() {
    setMemuat(true)
    setError('')
    client.get('/kelas/aktif')
      .then((r) => setAktif(r.data.aktif ? r.data : null))
      .catch(() => {})
    client.get('/kelas/saya')
      .then((r) => setKelas(r.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Gagal memuat daftar kelas.'))
      .finally(() => setMemuat(false))
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
    const p = dosen
      ? `Hapus kelas "${k.matkul}"? Semua soal, materi, tes, dan nilai mahasiswa di kelas ini ikut terhapus permanen. Lanjut?`
      : `Keluar dari kelas "${k.matkul}"? Progres kamu di kelas ini akan hilang. Lanjut?`
    if (!window.confirm(p)) return
    try {
      await client.delete(`/kelas/${k.id}`)
      muat()
    } catch (err) {
      alert(err?.response?.data?.detail || (dosen ? 'Gagal menghapus kelas.' : 'Gagal keluar dari kelas.'))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '.6rem' }}>
        <h2 className="section-title">Kelas Saya</h2>
        <button className={'btn btn-sm ' + (buka ? 'btn-ghost' : 'btn-primary')}
                onClick={() => setBuka(!buka)}>
          <Icon name={buka ? 'silang' : 'tambah'} size={15} />
          {buka ? 'Tutup' : (dosen ? 'Buat Kelas' : 'Gabung Kelas')}
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

      {msg && (
        <div className="card" style={{
          padding: '.7rem .9rem', marginTop: '.8rem', fontSize: '.88rem',
          borderColor: msg.startsWith('✅')
            ? 'color-mix(in srgb, var(--success) 45%, var(--border))'
            : 'color-mix(in srgb, var(--danger) 45%, var(--border))',
          background: msg.startsWith('✅')
            ? 'color-mix(in srgb, var(--success) 10%, var(--card))'
            : 'color-mix(in srgb, var(--danger) 10%, var(--card))',
        }}>{msg}</div>
      )}

      {memuat && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: '.9rem', marginTop: '.8rem' }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}
        </div>
      )}

      {!memuat && error && (
        <div className="card" style={{ padding: '1.4rem', marginTop: '.8rem', textAlign: 'center' }}>
          <div className="empty-ico" style={{ color: 'var(--danger)' }}><Icon name="info" size={24} /></div>
          <p style={{ color: 'var(--danger)', margin: '0 0 .8rem' }}>{error}</p>
          <button className="btn btn-primary btn-sm" onClick={muat}>
            <Icon name="ulang" size={15} /> Coba lagi
          </button>
        </div>
      )}

      {!memuat && !error && kelas.length === 0 && (
        <div className="empty" style={{ marginTop: '.8rem' }}>
          <div className="empty-ico anim-float"><Icon name="kelas" size={26} /></div>
          <p style={{ margin: '0 0 .2rem', fontWeight: 700 }}>
            {dosen ? 'Belum ada kelas' : 'Belum gabung kelas'}
          </p>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            {dosen ? 'Klik "Buat Kelas" di atas untuk memulai.'
                   : 'Klik "Gabung Kelas" dan masukkan kode dari gurumu.'}
          </p>
        </div>
      )}

      <div className="stagger" style={{ display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))',
                    gap: '.9rem', marginTop: '.8rem' }}>
        {kelas.map((k) => {
          const ini = aktif && aktif.id === k.id
          return (
            <div key={k.id} className={'card card-hover' + (ini ? ' card-accent' : '')} style={{
              padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '.5rem',
              borderColor: ini
                ? 'color-mix(in srgb, var(--primary) 55%, var(--border))' : 'var(--border)',
              background: ini
                ? 'linear-gradient(150deg, color-mix(in srgb, var(--primary) 8%, var(--card)), var(--card))'
                : 'var(--card)',
            }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                  <span style={{
                    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                    display: 'grid', placeItems: 'center', color: '#fff',
                    background: 'var(--grad-brand)', fontWeight: 800, fontSize: '.95rem',
                  }}>{(k.matkul || '?')[0].toUpperCase()}</span>
                  <span style={{ fontWeight: 700, overflow: 'hidden',
                                 textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.matkul}</span>
                </div>
                {ini && (
                  <span className="pill pill-accent" style={{ fontSize: '.68rem', padding: '.15rem .5rem',
                                                              color: 'var(--primary)', fontWeight: 700 }}>
                    ● AKTIF
                  </span>
                )}
              </div>

              <div className="muted" style={{ fontSize: '.78rem' }}>
                {[k.kelas_label, k.prodi, k.kampus].filter(Boolean).join(' · ') || '—'}
              </div>

              {dosen ? (
                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                  <span className="pill" style={{ fontSize: '.76rem' }}>
                    <Icon name="kunci" size={13} />
                    <b style={{ fontFamily: 'Consolas, monospace', color: 'var(--primary)',
                                letterSpacing: 1 }}>{k.kode}</b>
                  </span>
                  <span className="pill" style={{ fontSize: '.76rem' }}>
                    <Icon name="mahasiswa" size={13} /> {k.jumlah_anggota}
                  </span>
                </div>
              ) : (
                <div className="muted flex items-center gap-1" style={{ fontSize: '.8rem' }}>
                  <Icon name="profil" size={13} /> {k.dosen}
                </div>
              )}

              <div className="flex gap-2" style={{ marginTop: 'auto', paddingTop: '.5rem' }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}
                        onClick={() => masuk(k)}>
                  {ini ? 'Lanjut' : 'Masuk'} <Icon name="kanan" size={14} />
                </button>
                <button className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)',
                                 borderColor: 'color-mix(in srgb, var(--danger) 45%, var(--border))' }}
                        title={dosen ? 'Hapus kelas' : 'Keluar kelas'}
                        onClick={() => keluarHapus(k)}>
                  <Icon name={dosen ? 'hapus' : 'keluar'} size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
