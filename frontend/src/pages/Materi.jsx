import { useEffect, useState } from 'react'
import client from '../api/client'
import Icon from '../components/Icon'

export default function Materi() {
  const [list, setList] = useState([])
  const [dibuka, setDibuka] = useState(null)  // id materi teks yang sedang dibaca
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')

  function muat() {
    setMemuat(true)
    setError('')
    client.get('/materials')
      .then((r) => setList(r.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Gagal memuat materi.'))
      .finally(() => setMemuat(false))
  }

  useEffect(() => { muat() }, [])

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
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
        <span className="stat-ico" style={{ color: 'var(--primary)' }}>
          <Icon name="materi" size={22} />
        </span>
        <div>
          <h1 style={{ fontSize: '1.6rem', margin: 0, fontWeight: 800 }}>
            <span className="grad-text">Materi</span>
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>Materi belajar dari dosen.</p>
        </div>
      </div>

      {memuat ? (
        <div style={{ display: 'grid', gap: '.8rem', marginTop: '1.2rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card" style={{ padding: '1.1rem 1.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 13, width: '46%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 10, width: '68%' }} />
                </div>
                <div className="skeleton" style={{ width: 84, height: 30, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card card-accent" style={{ padding: '1.4rem', marginTop: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--danger)', fontWeight: 600 }}>
            <Icon name="info" size={18} />
            <span>{error}</span>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '.8rem' }} onClick={muat}>
            <Icon name="ulang" size={15} /> Coba lagi
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="empty" style={{ marginTop: '1.2rem' }}>
          <div className="empty-ico" style={{ color: 'var(--primary)' }}>
            <Icon name="materi" size={28} />
          </div>
          <div style={{ fontWeight: 700 }}>Belum ada materi</div>
          <p className="muted" style={{ margin: '.3rem 0 0', fontSize: '.88rem' }}>
            Materi dari dosen akan muncul di sini.
          </p>
        </div>
      ) : null}

      <div className="stagger" style={{ display: 'grid', gap: '.85rem', marginTop: '1.2rem' }}>
        {list.map((m) => {
          const isPdf = m.tipe === 'pdf'
          const terbuka = dibuka === m.id
          return (
            <div key={m.id} className="card card-hover" style={{ padding: '1.05rem 1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.95rem', flexWrap: 'wrap' }}>
                <span className="stat-ico" style={{ color: isPdf ? 'var(--accent)' : 'var(--primary)' }}>
                  <Icon name={isPdf ? 'dokumen' : 'materi'} size={20} />
                </span>

                <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.02rem', lineHeight: 1.3 }}>{m.judul}</div>
                  <div className="muted"
                       style={{ display: 'flex', alignItems: 'center', gap: '.85rem',
                                flexWrap: 'wrap', fontSize: '.78rem', marginTop: '.35rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.28rem' }}>
                      <Icon name="profil" size={13} /> {m.dibuat_oleh}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.28rem' }}>
                      <Icon name="jadwal" size={13} /> {m.created_at}
                    </span>
                  </div>
                </div>

                {isPdf ? (
                  <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => bukaPdf(m)}>
                    <Icon name="dokumen" size={15} /> Buka PDF
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
                          onClick={() => setDibuka(terbuka ? null : m.id)}>
                    <Icon name={terbuka ? 'silang' : 'kanan'} size={15} />
                    {terbuka ? 'Tutup' : 'Baca'}
                  </button>
                )}
              </div>

              {m.tipe === 'teks' && terbuka && (
                <div style={{ marginTop: '.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.7,
                              background: 'var(--bg-soft)', border: '1px solid var(--border-soft)',
                              borderRadius: 'var(--r-md)', padding: '1rem 1.1rem', fontSize: '.93rem' }}>
                  {m.konten}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
