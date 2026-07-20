import { useEffect, useState } from 'react'
import client from '../api/client'

export default function Materi() {
  const [list, setList] = useState([])
  const [dibuka, setDibuka] = useState(null)  // id materi teks yang sedang dibaca

  useEffect(() => {
    client.get('/materials').then((r) => setList(r.data)).catch(() => {})
  }, [])

  async function bukaPdf(m) {
    // Buka tab kosong dulu (dari klik langsung) agar tidak diblokir popup,
    // baru diisi setelah file ter-unduh dengan token login.
    const w = window.open('', '_blank')
    try {
      const res = await client.get(`/materials/${m.id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      if (w) w.location = url
      else window.open(url, '_blank')
    } catch {
      if (w) w.close()
      alert('Gagal membuka PDF.')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>📚 Materi</h1>
      <p className="muted" style={{ marginTop: 0 }}>Materi belajar dari dosen.</p>

      {list.length === 0 && <p className="muted">Belum ada materi.</p>}

      {list.map((m) => (
        <div key={m.id} className="card" style={{ padding: '1.1rem 1.3rem', marginBottom: '.8rem' }}>
          <div className="flex items-center justify-between" style={{ gap: '1rem' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{m.judul}</div>
              <div className="muted" style={{ fontSize: '.76rem' }}>
                {m.tipe === 'pdf' ? '📄 PDF' : '✍️ Teks'} · {m.dibuat_oleh} · {m.created_at}
              </div>
            </div>
            {m.tipe === 'pdf' ? (
              <button className="btn btn-primary" style={{ padding: '.4rem .9rem', fontSize: '.85rem', flexShrink: 0 }}
                      onClick={() => bukaPdf(m)}>Buka PDF ↗</button>
            ) : (
              <button className="btn btn-ghost" style={{ padding: '.4rem .9rem', fontSize: '.85rem', flexShrink: 0 }}
                      onClick={() => setDibuka(dibuka === m.id ? null : m.id)}>
                {dibuka === m.id ? 'Tutup' : 'Baca'}
              </button>
            )}
          </div>
          {m.tipe === 'teks' && dibuka === m.id && (
            <div style={{ marginTop: '.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                          borderTop: '1px solid var(--border)', paddingTop: '.9rem' }}>
              {m.konten}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
