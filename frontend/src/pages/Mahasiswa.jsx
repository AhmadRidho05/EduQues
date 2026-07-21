import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

export default function Mahasiswa() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [detail, setDetail] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')

  function muat() {
    setMemuat(true)
    setError('')
    client.get('/dosen/students')
      .then((r) => setStudents(r.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Gagal memuat daftar mahasiswa.'))
      .finally(() => setMemuat(false))
  }

  useEffect(() => { muat() }, [])

  function lihat(id) {
    client.get(`/dosen/students/${id}`)
      .then((r) => setDetail(r.data))
      .catch((err) => alert(err?.response?.data?.detail || 'Gagal memuat detail mahasiswa.'))
  }

  if (user?.role !== 'dosen')
    return <p className="muted">Halaman ini khusus dosen.</p>

  // Total bab diambil dari data detail bila sudah pernah dibuka; jika belum,
  // kemajuan diperkirakan dari bintang relatif terhadap yang tertinggi.
  const totalBab = detail?.progress?.length || 0
  const maksBintang = Math.max(1, ...students.map((s) => Number(s.total_stars) || 0))

  function persen(s) {
    const nilai = totalBab > 0
      ? ((Number(s.levels_completed) || 0) / totalBab) * 100
      : ((Number(s.total_stars) || 0) / maksBintang) * 100
    return Math.max(0, Math.min(100, Math.round(nilai)))
  }

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2" style={{ marginBottom: '.2rem' }}>
        <Icon name="mahasiswa" size={26} style={{ color: 'var(--primary)' }} />
        <h1 className="grad-text" style={{ fontSize: '1.6rem', margin: 0 }}>Pantau Mahasiswa</h1>
      </div>
      <p className="muted" style={{ marginTop: 0, fontSize: '.9rem' }}>
        Lihat kemajuan belajar tiap mahasiswa, lalu buka detail untuk rincian per level.
      </p>

      {memuat ? (
        <div className="card" style={{ padding: '1rem 1.2rem', marginTop: '1rem' }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3" style={{ padding: '.7rem 0' }}>
              <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ height: 12, width: '38%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: '62%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{
          padding: '1.2rem', marginTop: '1rem',
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
      ) : students.length === 0 ? (
        <div className="empty" style={{ marginTop: '1rem' }}>
          <div className="empty-ico"><Icon name="mahasiswa" size={28} style={{ color: 'var(--primary)' }} /></div>
          <b>Belum ada mahasiswa</b>
          <p className="muted" style={{ margin: '.35rem 0 0', fontSize: '.88rem' }}>
            Mahasiswa akan muncul di sini begitu mereka bergabung.
          </p>
        </div>
      ) : null}

      {!memuat && !error && students.length > 0 && (
        <div className="card stagger" style={{ marginTop: '1rem', overflow: 'hidden', padding: '.4rem' }}>
          {students.map((s) => (
            <div key={s.id} className="row-hover flex items-center gap-3"
                 style={{ padding: '.85rem 1rem', borderRadius: 'var(--r-md)', flexWrap: 'wrap' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: 'var(--grad-brand)', color: '#fff',
                display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '1.05rem',
              }}>
                {String(s.nama || '?').charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.nama}
                </div>
                <div className="muted" style={{ fontSize: '.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.email}
                </div>
                <div className="bar bar-sm" style={{ marginTop: '.5rem', maxWidth: 260 }}>
                  <i style={{ width: `${persen(s)}%` }} />
                </div>
                <div className="muted" style={{ fontSize: '.72rem', marginTop: '.25rem' }}>
                  {s.levels_completed} level selesai
                </div>
              </div>

              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                <span className="pill pill-accent">
                  <Icon name="lencana" size={14} /> {s.rank}
                </span>
                <span className="pill">
                  <Icon name="kilat" size={14} style={{ color: 'var(--accent)' }} /> Lv {s.player_level}
                </span>
                <span className="pill" style={{ color: 'var(--gold)' }}>
                  <Icon name="bintang" size={14} /> {s.total_stars}
                </span>
              </div>

              <button className="btn btn-subtle btn-sm flex items-center gap-2"
                      style={{ flexShrink: 0 }} onClick={() => lihat(s.id)}>
                Detail <Icon name="kanan" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail progres seorang mahasiswa */}
      {detail && (
        <div className="card card-accent fade-in" style={{ padding: '1.4rem', marginTop: '1.4rem' }}>
          <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="flex items-center gap-3">
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'var(--grad-brand)', color: '#fff',
                display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '1.1rem',
              }}>
                {String(detail.nama || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{detail.nama}</h3>
                <span className="muted" style={{ fontSize: '.8rem' }}>Level pemain {detail.player_level}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={() => setDetail(null)}>
              <Icon name="silang" size={14} /> Tutup
            </button>
          </div>

          <div style={{
            display: 'grid', gap: '.7rem', marginTop: '1.1rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          }}>
            <div className="stat flex items-center gap-3" style={{ padding: '.8rem .9rem' }}>
              <div className="stat-ico" style={{ width: 34, height: 34, borderRadius: 10, color: 'var(--accent)' }}>
                <Icon name="kilat" size={17} />
              </div>
              <div>
                <div className="stat-num" style={{ fontSize: '1.25rem' }}>{detail.xp}</div>
                <div className="stat-lbl">XP</div>
              </div>
            </div>
            <div className="stat flex items-center gap-3" style={{ padding: '.8rem .9rem' }}>
              <div className="stat-ico" style={{ width: 34, height: 34, borderRadius: 10, color: 'var(--gold)' }}>
                <Icon name="koin" size={17} />
              </div>
              <div>
                <div className="stat-num" style={{ fontSize: '1.25rem' }}>{detail.koin}</div>
                <div className="stat-lbl">Koin</div>
              </div>
            </div>
            <div className="stat flex items-center gap-3" style={{ padding: '.8rem .9rem' }}>
              <div className="stat-ico" style={{ width: 34, height: 34, borderRadius: 10, color: 'var(--primary)' }}>
                <Icon name="lencana" size={17} />
              </div>
              <div>
                <div className="stat-num" style={{ fontSize: '1.05rem' }}>{detail.rank}</div>
                <div className="stat-lbl">Rank</div>
              </div>
            </div>
          </div>

          <h2 className="section-title" style={{ marginTop: '1.4rem' }}>Progres per level</h2>
          <div className="table-wrap" style={{ marginTop: '.6rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Bintang</th>
                  <th>Skor terbaik</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {detail.progress.map((p) => (
                  <tr key={p.level_id}>
                    <td>
                      <span className="muted" style={{ fontSize: '.8rem' }}>{p.urutan}.</span>{' '}
                      <span style={{ fontWeight: 600 }}>{p.nama}</span>
                    </td>
                    <td style={{ color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                      {p.stars > 0 ? '⭐'.repeat(p.stars) : <span className="muted">–</span>}
                    </td>
                    <td>{p.best_score || <span className="muted">–</span>}</td>
                    <td>
                      <span className="pill" style={{
                        color: p.selesai ? 'var(--success)' : 'var(--subtext)',
                        borderColor: p.selesai
                          ? 'color-mix(in srgb, var(--success) 40%, transparent)'
                          : 'var(--border-soft)',
                      }}>
                        <Icon name={p.selesai ? 'cek' : 'waktu'} size={13} />
                        {p.selesai ? 'Selesai' : 'Belum'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
