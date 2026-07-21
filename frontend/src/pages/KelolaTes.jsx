import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

const STATUS = {
  belum_dibuka: { label: 'Belum dibuka', ikon: 'kunci', warna: 'var(--subtext)' },
  berlangsung: { label: 'Sedang dibuka', ikon: 'kilat', warna: 'var(--success)' },
  ditutup: { label: 'Ditutup', ikon: 'silang', warna: 'var(--danger)' },
}
const statusInfo = (s) => STATUS[s] || { label: s || 'Tidak diketahui', ikon: 'info', warna: 'var(--subtext)' }

export default function KelolaTes() {
  const { user } = useAuth()
  const [tes, setTes] = useState([])
  const [form, setForm] = useState({ judul: '', jumlah_soal: 10, waktu_mulai: '', waktu_selesai: '' })
  const [msg, setMsg] = useState('')
  const [hasil, setHasil] = useState(null)  // {tid, judul, rows}
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { muat() }, [])
  function muat() {
    setMemuat(true)
    setError('')
    client.get('/tes')
      .then((r) => setTes(r.data))
      .catch((err) => setError(err?.response?.data?.detail || 'Gagal memuat daftar tes.'))
      .finally(() => setMemuat(false))
  }
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
    } catch (e2) { setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal membuat tes.')) }
  }

  async function hapus(t) {
    if (!window.confirm(`Hapus tes "${t.judul}"? Nilai mahasiswa untuk tes ini ikut terhapus permanen. Lanjut?`)) return
    try {
      await client.delete(`/tes/${t.id}`)
      if (hasil?.tid === t.id) setHasil(null)
      muat()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Gagal menghapus tes.')
    }
  }

  async function lihatHasil(t) {
    try {
      const { data } = await client.get(`/tes/${t.id}/hasil`)
      setHasil({ tid: t.id, judul: data.judul, rows: data.hasil })
    } catch (err) {
      alert(err?.response?.data?.detail || 'Gagal memuat hasil tes.')
    }
  }

  if (user?.role !== 'dosen') return <p className="muted">Halaman ini khusus dosen.</p>

  const msgGagal = msg.startsWith('❌')

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2" style={{ marginBottom: '.2rem' }}>
        <Icon name="jadwal" size={26} style={{ color: 'var(--primary)' }} />
        <h1 className="grad-text" style={{ fontSize: '1.6rem', margin: 0 }}>Kelola Tes</h1>
      </div>
      <p className="muted" style={{ marginTop: 0, fontSize: '.9rem' }}>
        Jadwalkan tes, pantau statusnya, dan lihat rekap nilai mahasiswa.
      </p>

      <form onSubmit={buat} className="card card-accent" style={{ padding: '1.4rem', marginTop: '1rem' }}>
        <h2 className="section-title">Buat Tes Terjadwal</h2>
        <p className="muted" style={{ margin: '.15rem 0 1rem', fontSize: '.84rem' }}>
          Soal diambil acak dari bank soal sesuai jumlah yang diisi.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '.9rem' }}>
          <div>
            <label style={{ fontSize: '.8rem', color: 'var(--subtext)', fontWeight: 600 }}>Judul</label>
            <input className="input" style={{ marginTop: 6 }} value={form.judul} onChange={setF('judul')}
                   placeholder="Tes Harian - Variabel" />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', color: 'var(--subtext)', fontWeight: 600 }}>Jumlah soal</label>
            <input className="input" type="number" min="1" style={{ marginTop: 6 }}
                   value={form.jumlah_soal} onChange={setF('jumlah_soal')} />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', color: 'var(--subtext)', fontWeight: 600 }}>Waktu mulai</label>
            <input className="input" type="datetime-local" style={{ marginTop: 6 }}
                   value={form.waktu_mulai} onChange={setF('waktu_mulai')} />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', color: 'var(--subtext)', fontWeight: 600 }}>Waktu selesai</label>
            <input className="input" type="datetime-local" style={{ marginTop: 6 }}
                   value={form.waktu_selesai} onChange={setF('waktu_selesai')} />
          </div>
        </div>

        <div className="flex items-center gap-3" style={{ marginTop: '1.1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary flex items-center gap-2">
            <Icon name="tambah" size={16} /> Buat Tes
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

      <div className="flex items-center gap-2" style={{ marginTop: '1.9rem', marginBottom: '.8rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Daftar Tes</h2>
        <span className="pill pill-accent" style={{ fontSize: '.76rem' }}>{tes.length}</span>
      </div>

      {memuat ? (
        <div style={{ display: 'grid', gap: '.7rem' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card" style={{ padding: '1.1rem 1.2rem' }}>
              <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 10, width: '68%' }} />
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
      ) : tes.length === 0 ? (
        <div className="empty">
          <div className="empty-ico"><Icon name="jadwal" size={28} style={{ color: 'var(--primary)' }} /></div>
          <b>Belum ada tes</b>
          <p className="muted" style={{ margin: '.35rem 0 0', fontSize: '.88rem' }}>
            Buat tes terjadwal pertama lewat formulir di atas.
          </p>
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gap: '.8rem' }}>
          {tes.map((t) => {
            const st = statusInfo(t.status)
            return (
              <div key={t.id} className="card card-hover"
                   style={{ padding: '1.1rem 1.2rem' }}>
                <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: '1 1 240px' }}>
                    <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                      <b style={{ fontSize: '1.02rem' }}>{t.judul}</b>
                      <span className="pill" style={{
                        color: st.warna, fontSize: '.76rem',
                        borderColor: `color-mix(in srgb, ${st.warna} 40%, transparent)`,
                        background: `color-mix(in srgb, ${st.warna} 12%, transparent)`,
                      }}>
                        <Icon name={st.ikon} size={13} /> {st.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 muted"
                         style={{ fontSize: '.79rem', marginTop: '.55rem', flexWrap: 'wrap' }}>
                      <span className="flex items-center gap-1">
                        <Icon name="soal" size={14} /> {t.jumlah_soal} soal
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="jadwal" size={14} /> {t.mulai} → {t.selesai}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="mahasiswa" size={14} /> {t.peserta_selesai} peserta selesai
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2" style={{ flexShrink: 0 }}>
                    <button className="btn btn-subtle btn-sm flex items-center gap-2" onClick={() => lihatHasil(t)}>
                      <Icon name="skor" size={14} /> Hasil
                    </button>
                    <button className="btn btn-danger btn-sm flex items-center gap-2" onClick={() => hapus(t)}>
                      <Icon name="hapus" size={14} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {hasil && (
        <div className="card card-accent fade-in" style={{ padding: '1.4rem', marginTop: '1.4rem' }}>
          <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Rekap nilai: {hasil.judul}</h2>
            <button className="btn btn-ghost btn-sm flex items-center gap-2" onClick={() => setHasil(null)}>
              <Icon name="silang" size={14} /> Tutup
            </button>
          </div>

          {hasil.rows.length === 0 ? (
            <div className="empty" style={{ marginTop: '1rem' }}>
              <div className="empty-ico"><Icon name="skor" size={28} style={{ color: 'var(--primary)' }} /></div>
              <b>Belum ada yang mengerjakan</b>
              <p className="muted" style={{ margin: '.35rem 0 0', fontSize: '.88rem' }}>
                Nilai akan muncul di sini setelah mahasiswa menyelesaikan tes.
              </p>
            </div>
          ) : (
            <div className="table-wrap" style={{ marginTop: '.8rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Mahasiswa</th>
                    <th>Nilai</th>
                    <th>Benar</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hasil.rows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{r.nama}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{r.nilai}</td>
                      <td className="muted">{r.benar}/{r.total}</td>
                      <td>
                        <span className="pill" style={{
                          color: r.selesai ? 'var(--success)' : 'var(--subtext)',
                          borderColor: r.selesai
                            ? 'color-mix(in srgb, var(--success) 40%, transparent)'
                            : 'var(--border-soft)',
                        }}>
                          <Icon name={r.selesai ? 'cek' : 'waktu'} size={13} />
                          {r.selesai ? 'Selesai' : 'Belum'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
