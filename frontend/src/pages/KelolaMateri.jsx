import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function KelolaMateri() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [judul, setJudul] = useState('')
  const [tipe, setTipe] = useState('teks')     // 'teks' | 'pdf'
  const [konten, setKonten] = useState('')
  const [file, setFile] = useState(null)
  const [fileKey, setFileKey] = useState(0)    // untuk mengosongkan input file
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { muat() }, [])
  function muat() { client.get('/materials').then((r) => setList(r.data)).catch(() => {}) }

  async function simpan(e) {
    e.preventDefault()
    setMsg('')
    setBusy(true)
    try {
      if (tipe === 'teks') {
        await client.post('/materials', { judul, konten })
      } else {
        if (!file) { setMsg('❌ Pilih file PDF dulu.'); setBusy(false); return }
        const fd = new FormData()
        fd.append('judul', judul)
        fd.append('file', file)
        await client.post('/materials/upload', fd)
      }
      setJudul(''); setKonten(''); setFile(null); setFileKey((k) => k + 1)
      setMsg('✅ Materi tersimpan & otomatis muncul di menu Materi mahasiswa.')
      muat()
    } catch (e2) {
      setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal menyimpan.'))
    } finally {
      setBusy(false)
    }
  }

  async function hapus(m) {
    if (!window.confirm(`Hapus materi "${m.judul}"?`)) return
    await client.delete(`/materials/${m.id}`)
    muat()
  }

  if (user?.role !== 'dosen')
    return <p className="muted">Halaman ini khusus dosen.</p>

  const tab = (val, label) => (
    <button type="button" onClick={() => setTipe(val)}
            className={'btn ' + (tipe === val ? 'btn-primary' : 'btn-ghost')}
            style={{ padding: '.45rem 1rem' }}>{label}</button>
  )

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>📚 Kelola Materi</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Tulis materi atau unggah PDF. Begitu disimpan, otomatis muncul di menu
        Materi semua mahasiswa.
      </p>

      <form onSubmit={simpan} className="card" style={{ padding: '1.4rem', marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '.82rem' }}>Judul materi</label>
        <input className="input" value={judul} onChange={(e) => setJudul(e.target.value)}
               required style={{ margin: '.3rem 0 1rem' }} placeholder="mis. Pengantar Variabel" />

        <div className="flex gap-2" style={{ marginBottom: '1rem' }}>
          {tab('teks', '✍️ Tulis teks')}
          {tab('pdf', '📄 Upload PDF')}
        </div>

        {tipe === 'teks' ? (
          <>
            <label style={{ fontSize: '.82rem' }}>Isi materi</label>
            <textarea className="input" value={konten} onChange={(e) => setKonten(e.target.value)}
                      required style={{ marginTop: '.3rem', minHeight: 160 }}
                      placeholder="Tulis materi di sini…" />
          </>
        ) : (
          <>
            <label style={{ fontSize: '.82rem' }}>File PDF (maks 10 MB)</label>
            <input key={fileKey} type="file" accept="application/pdf"
                   onChange={(e) => setFile(e.target.files[0] || null)}
                   style={{ display: 'block', marginTop: '.4rem', color: 'var(--text)' }} />
            {file && <p className="muted" style={{ fontSize: '.8rem' }}>Dipilih: {file.name}</p>}
          </>
        )}

        {msg && <p style={{ marginTop: '.9rem' }}>{msg}</p>}
        <button className="btn btn-primary" disabled={busy} style={{ marginTop: '1rem' }}>
          {busy ? 'Menyimpan…' : '📤 Kirim Materi'}
        </button>
      </form>

      <h3>Materi terkirim ({list.length})</h3>
      {list.length === 0 && <p className="muted">Belum ada materi.</p>}
      {list.map((m) => (
        <div key={m.id} className="card flex items-center justify-between"
             style={{ padding: '.9rem 1.1rem', marginBottom: '.6rem', gap: '1rem' }}>
          <div style={{ minWidth: 0 }}>
            <span className="muted" style={{ fontSize: '.72rem' }}>
              {m.tipe === 'pdf' ? '📄 PDF' : '✍️ Teks'} · {m.created_at}
            </span>
            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.judul}
            </div>
          </div>
          <button className="btn btn-ghost" style={{ padding: '.35rem .7rem', fontSize: '.82rem',
                  color: 'var(--danger)', borderColor: 'var(--danger)', flexShrink: 0 }}
                  onClick={() => hapus(m)}>Hapus</button>
        </div>
      ))}
    </div>
  )
}
