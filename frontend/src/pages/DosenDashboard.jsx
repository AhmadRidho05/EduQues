import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

export default function DosenDashboard() {
  const { user } = useAuth()
  const [ov, setOv] = useState(null)
  const [levels, setLevels] = useState([])
  const [kelas, setKelas] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')

  function muat() {
    setError(''); setMemuat(true)
    Promise.all([
      client.get('/dosen/overview'),
      client.get('/levels'),
      client.get('/kelas/aktif'),
    ])
      .then(([o, l, k]) => {
        setOv(o.data); setLevels(l.data)
        setKelas(k.data.aktif ? k.data : null)
      })
      .catch((e) => {
        // 409 = belum pilih kelas; interceptor axios sudah mengarahkan ke /profil,
        // jadi jangan tampilkan layar error (cukup abaikan di sini).
        if (e?.response?.status === 409) return
        setError(e?.response?.data?.detail || 'Gagal memuat dashboard.')
      })
      .finally(() => setMemuat(false))
  }
  useEffect(() => { muat() }, [])

  // Bab boss TIDAK punya soal sendiri (soalnya diambil dari bab-bab sebelumnya),
  // jadi bab boss tidak ikut dihitung sebagai "belum terisi".
  const babBiasa = levels.filter((l) => !l.is_boss)
  const babTerisi = babBiasa.filter((l) => l.jumlah_soal > 0).length
  const persenSiap = babBiasa.length ? Math.round((babTerisi / babBiasa.length) * 100) : 0
  const maxSoal = Math.max(1, ...levels.map((l) => l.jumlah_soal || 0))

  const Stat = ({ ikon, angka, label, warna }) => (
    <div className="stat" style={{ flex: '1 1 170px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '.6rem' }}>
        <span className="stat-ico" style={warna ? {
          background: `color-mix(in srgb, ${warna} 16%, transparent)`,
          borderColor: `color-mix(in srgb, ${warna} 32%, transparent)`,
          color: warna,
        } : undefined}>
          <Icon name={ikon} size={19} />
        </span>
      </div>
      <div className="stat-num">{angka ?? '–'}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  )

  const Pintasan = ({ to, ikon, judul, desc }) => (
    <Link to={to} className="card card-hover" style={{
      padding: '1.2rem', flex: '1 1 210px', display: 'block',
      color: 'var(--text)', textDecoration: 'none',
    }}>
      <span className="stat-ico" style={{ marginBottom: '.7rem' }}>
        <Icon name={ikon} size={19} />
      </span>
      <div style={{ fontWeight: 700, marginTop: '.2rem' }}>{judul}</div>
      <div className="muted" style={{ fontSize: '.84rem', marginTop: '.15rem' }}>{desc}</div>
      <div style={{ marginTop: '.7rem', color: 'var(--primary)', fontSize: '.85rem',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        Buka <Icon name="kanan" size={14} />
      </div>
    </Link>
  )

  if (memuat) return (
    <div>
      <div className="skeleton" style={{ height: 76, marginBottom: '1.2rem' }} />
      <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 118, flex: '1 1 170px' }} />
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
      <div className="empty-ico"><Icon name="info" size={26} /></div>
      <p style={{ color: 'var(--danger)' }}>{error}</p>
      <button className="btn btn-primary" onClick={muat}>
        <Icon name="ulang" size={16} /> Coba lagi
      </button>
    </div>
  )

  return (
    <div className="fade-in">
      {/* Sapaan */}
      <div className="card card-accent" style={{ padding: '1.5rem 1.6rem', marginBottom: '1.2rem' }}>
        <div className="flex items-center justify-between gap-4" style={{ flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.55rem' }}>
              Halo, <span className="grad-text">{user?.nama}</span> 👋
            </h1>
            <p className="muted" style={{ margin: '.25rem 0 0', fontSize: '.92rem' }}>
              {kelas
                ? <>Kelas aktif: <b style={{ color: 'var(--text)' }}>{kelas.matkul}</b>
                    {kelas.kelas_label ? ` · ${kelas.kelas_label}` : ''}</>
                : 'Belum ada kelas aktif.'}
            </p>
          </div>
          {kelas && (
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <span className="pill pill-accent">
                <Icon name="kunci" size={14} />
                Kode: <b style={{ letterSpacing: 1, fontFamily: 'Consolas, monospace' }}>{kelas.kode}</b>
              </span>
              <Link to="/profil" className="btn btn-ghost btn-sm">
                <Icon name="ulang" size={14} /> Ganti kelas
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Statistik */}
      <div className="flex gap-3 stagger" style={{ flexWrap: 'wrap', marginBottom: '1.4rem' }}>
        <Stat ikon="mahasiswa" angka={ov?.num_students} label="Mahasiswa bergabung" warna="var(--primary)" />
        <Stat ikon="materi" angka={ov?.num_levels} label="Bab dalam kelas" warna="var(--accent)" />
        <Stat ikon="soal" angka={ov?.num_questions} label="Total soal" warna="var(--gold)" />
        <Stat ikon="cek" angka={`${persenSiap}%`} label="Bab sudah ada soal" warna="var(--success)" />
      </div>

      {/* Kesiapan bank soal — data nyata dari /levels */}
      <div className="card" style={{ padding: '1.3rem 1.4rem', marginBottom: '1.4rem' }}>
        <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
          <h2 className="section-title">Kesiapan Bank Soal</h2>
          <span className="muted" style={{ fontSize: '.84rem' }}>
            {babTerisi} dari {babBiasa.length} bab materi sudah terisi
          </span>
        </div>
        <div className="bar" style={{ margin: '.7rem 0 1.2rem' }}>
          <i style={{ width: `${persenSiap}%` }} />
        </div>

        <div style={{ display: 'grid', gap: '.55rem' }}>
          {levels.map((l) => {
            const kosong = !l.jumlah_soal && !l.is_boss   // boss memang tanpa soal sendiri
            return (
              <div key={l.id} className="flex items-center gap-3" style={{ fontSize: '.86rem' }}>
                <span style={{ width: 132, flexShrink: 0, display: 'flex',
                               alignItems: 'center', gap: 6 }}>
                  <span>{l.emoji}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis',
                                 whiteSpace: 'nowrap' }}>{l.nama}</span>
                </span>
                <div className="bar bar-sm" style={{ flex: 1 }}>
                  <i style={{
                    width: l.is_boss ? '100%'
                      : `${Math.round(((l.jumlah_soal || 0) / maxSoal) * 100)}%`,
                    background: kosong ? 'var(--border)'
                      : (l.is_boss ? 'var(--grad-danger)' : 'var(--grad-brand)'),
                    opacity: l.is_boss ? .35 : 1,
                  }} />
                </div>
                <span style={{ width: 96, textAlign: 'right', flexShrink: 0, fontSize: '.78rem',
                               color: kosong ? 'var(--danger)'
                                 : (l.is_boss ? 'var(--danger)' : 'var(--subtext)') }}>
                  {l.is_boss ? 'ujian (soal dari bab lain)'
                    : (kosong ? 'kosong' : `${l.jumlah_soal} soal`)}
                </span>
              </div>
            )
          })}
        </div>

        {babTerisi < babBiasa.length && (
          <div style={{ marginTop: '1rem' }}>
            <Link to="/dosen/soal" className="btn btn-primary btn-sm">
              <Icon name="tambah" size={15} /> Isi bab yang masih kosong
            </Link>
          </div>
        )}
      </div>

      {/* Pintasan */}
      <h2 className="section-title" style={{ marginBottom: '.7rem' }}>Kelola Kelas</h2>
      <div className="flex gap-3 stagger" style={{ flexWrap: 'wrap' }}>
        <Pintasan to="/dosen/soal" ikon="soal" judul="Kelola Soal"
                  desc="Tambah, ubah, hapus soal tiap bab" />
        <Pintasan to="/dosen/tes" ikon="jadwal" judul="Kelola Tes"
                  desc="Buat & jadwalkan tes harian" />
        <Pintasan to="/dosen/materi" ikon="unggah" judul="Kelola Materi"
                  desc="Kirim materi teks atau PDF" />
        <Pintasan to="/dosen/mahasiswa" ikon="mahasiswa" judul="Pantau Mahasiswa"
                  desc="Lihat progres & nilai mahasiswa" />
      </div>
    </div>
  )
}
