import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

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
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { muat() }, [])
  function muat() {
    setMemuat(true)
    setError('')
    client.get('/materials')
      .then((r) => setList(r.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Gagal memuat materi.'))
      .finally(() => setMemuat(false))
  }

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
    if (!window.confirm(`Hapus materi "${m.judul}"? Materi ini akan hilang permanen dari menu Materi semua mahasiswa. Lanjut?`)) return
    try {
      await client.delete(`/materials/${m.id}`)
      muat()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Gagal menghapus materi.')
    }
  }

  if (user?.role !== 'dosen')
    return <p className="muted">Halaman ini khusus dosen.</p>

  const tab = (val, label, ikon) => (
    <button type="button" onClick={() => setTipe(val)}
            className={'btn flex items-center gap-2 ' + (tipe === val ? 'btn-primary' : 'btn-subtle')}
            style={{ padding: '.5rem 1.05rem' }}>
      <Icon name={ikon} size={16} /> {label}
    </button>
  )

  const msgGagal = msg.startsWith('❌')

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2" style={{ marginBottom: '.2rem' }}>
        <Icon name="materi" size={26} style={{ color: 'var(--primary)' }} />
        <h1 className="grad-text" style={{ fontSize: '1.6rem', margin: 0 }}>Kelola Materi</h1>
      </div>
      <p className="muted" style={{ marginTop: 0, fontSize: '.9rem' }}>
        Tulis materi atau unggah PDF. Begitu disimpan, otomatis muncul di menu
        Materi semua mahasiswa.
      </p>

      <form onSubmit={simpan} className="card card-accent" style={{ padding: '1.4rem', marginTop: '1rem', marginBottom: '1.9rem' }}>
        <h2 className="section-title">Materi Baru</h2>

        <div style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: '.8rem', color: 'var(--subtext)', fontWeight: 600 }}>Judul materi</label>
          <input className="input" value={judul} onChange={(e) => setJudul(e.target.value)}
                 required style={{ margin: '.35rem 0 1.1rem' }} placeholder="mis. Pengantar Variabel" />
        </div>

        <div className="flex gap-2" style={{ marginBottom: '1.1rem', flexWrap: 'wrap' }}>
          {tab('teks', 'Tulis teks', 'materi')}
          {tab('pdf', 'Upload PDF', 'unggah')}
        </div>

        {tipe === 'teks' ? (
          <>
            <label style={{ fontSize: '.8rem', color: 'var(--subtext)', fontWeight: 600 }}>Isi materi</label>
            <textarea className="input" value={konten} onChange={(e) => setKonten(e.target.value)}
                      required style={{ marginTop: '.35rem', minHeight: 170, lineHeight: 1.6 }}
                      placeholder="Tulis materi di sini…" />
          </>
        ) : (
          <>
            <label style={{ fontSize: '.8rem', color: 'var(--subtext)', fontWeight: 600 }}>File PDF (maks 10 MB)</label>
            <label style={{
              display: 'block', marginTop: '.45rem', cursor: 'pointer',
              border: '2px dashed ' + (file ? 'color-mix(in srgb, var(--primary) 55%, transparent)' : 'var(--border)'),
              borderRadius: 'var(--r-lg)', padding: '1.8rem 1.2rem', textAlign: 'center',
              background: file ? 'color-mix(in srgb, var(--primary) 7%, transparent)' : 'var(--bg-soft)',
              transition: 'border-color .18s, background .18s',
            }}>
              <input key={fileKey} type="file" accept="application/pdf"
                     onChange={(e) => setFile(e.target.files[0] || null)}
                     style={{ display: 'none' }} />
              {file ? (
                <div className="flex items-center justify-center gap-2" style={{ fontWeight: 600 }}>
                  <Icon name="dokumen" size={20} style={{ color: 'var(--primary)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>
                    {file.name}
                  </span>
                </div>
              ) : (
                <>
                  <div className="empty-ico" style={{ width: 52, height: 52, borderRadius: 16, marginBottom: '.6rem' }}>
                    <Icon name="unggah" size={24} style={{ color: 'var(--primary)' }} />
                  </div>
                  <b style={{ fontSize: '.92rem' }}>Klik untuk memilih berkas PDF</b>
                </>
              )}
              <p className="muted" style={{ margin: '.4rem 0 0', fontSize: '.78rem' }}>
                {file ? 'Klik lagi untuk mengganti berkas' : 'Hanya format PDF, maksimal 10 MB'}
              </p>
            </label>
          </>
        )}

        <div className="flex items-center gap-3" style={{ marginTop: '1.2rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary flex items-center gap-2" disabled={busy}>
            <Icon name={busy ? 'waktu' : 'unggah'} size={16} />
            {busy ? 'Menyimpan…' : 'Kirim Materi'}
          </button>
          {msg && (
            <span className="pill" style={{
              fontSize: '.82rem',
              color: msgGagal ? 'var(--danger)' : 'var(--success)',
              borderColor: msgGagal
                ? 'color-mix(in srgb, var(--danger) 40%, transparent)'
                : 'color-mix(in srgb, var(--success) 40%, transparent)',
            }}>
              <Icon name={msgGagal ? 'silang' : 'cek'} size={14} />
              {msg.replace(/^[❌✅]\s*/, '')}
            </span>
          )}
        </div>
      </form>

      <div className="flex items-center gap-2" style={{ marginBottom: '.8rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Materi terkirim</h2>
        <span className="pill pill-accent" style={{ fontSize: '.76rem' }}>{list.length}</span>
      </div>

      {memuat ? (
        <div style={{ display: 'grid', gap: '.6rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card flex items-center gap-3" style={{ padding: '1rem 1.1rem' }}>
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 10, width: '30%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '55%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{
          padding: '1.2rem',
          borderColor: 'color-mix(in srgb, var(--danger) 45%, transparent)',
          background: 'color-mix(in srgb, var(--danger) 8%, var(--card))',
        }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--danger)', fontWeight: 600 }}>
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
          <button className="btn btn-ghost btn-sm flex items-center gap-2" style={{ marginTop: '.8rem' }} onClick={muat}>
            <Icon name="ulang" size={15} /> Coba lagi
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="empty">
          <div className="empty-ico"><Icon name="materi" size={28} style={{ color: 'var(--primary)' }} /></div>
          <b>Belum ada materi</b>
          <p className="muted" style={{ margin: '.35rem 0 0', fontSize: '.88rem' }}>
            Materi yang kamu kirim akan tampil di sini.
          </p>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gap: '.6rem' }}>
          {list.map((m) => {
            const pdf = m.tipe === 'pdf'
            return (
              <div key={m.id} className="card card-hover flex items-center justify-between gap-3"
                   style={{ padding: '.95rem 1.1rem' }}>
                <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                  <div className="stat-ico" style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    color: pdf ? 'var(--accent)' : 'var(--primary)',
                    background: pdf
                      ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                      : 'color-mix(in srgb, var(--primary) 15%, transparent)',
                    borderColor: pdf
                      ? 'color-mix(in srgb, var(--accent) 30%, transparent)'
                      : 'color-mix(in srgb, var(--primary) 30%, transparent)',
                  }}>
                    <Icon name={pdf ? 'dokumen' : 'materi'} size={19} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.judul}
                    </div>
                    <div className="flex items-center gap-2" style={{ marginTop: '.3rem', flexWrap: 'wrap' }}>
                      <span className="pill" style={{ fontSize: '.72rem', padding: '.2rem .55rem' }}>
                        {pdf ? 'PDF' : 'Teks'}
                      </span>
                      <span className="muted flex items-center gap-1" style={{ fontSize: '.74rem' }}>
                        <Icon name="waktu" size={12} /> {m.created_at}
                      </span>
                    </div>
                  </div>
                </div>

                <button className="btn btn-danger btn-sm flex items-center gap-2"
                        style={{ flexShrink: 0 }} onClick={() => hapus(m)}>
                  <Icon name="hapus" size={14} /> Hapus
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
