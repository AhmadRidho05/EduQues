import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'

const TIPE_LABEL = {
  mc: 'Pilihan ganda',
  essay: 'Isian singkat / Esai',
  out: 'Tebak output (IT)',
  blank: 'Lengkapi kode (IT)',
  code: 'Tulis kode (IT)',
}
const kosong = { tipe: 'mc', q: '', hint: '', optsText: '', ansText: '', code: '', starter: '', expected: '' }
const splitLines = (t) => t.split('\n').map((s) => s.trim()).filter(Boolean)

const lbl = { fontSize: '.82rem', fontWeight: 600, display: 'block', marginTop: '.85rem' }
const mono = { fontFamily: 'Consolas, monospace' }

export default function KelolaSoal() {
  const { user } = useAuth()
  const [levels, setLevels] = useState([])
  const [levelId, setLevelId] = useState('')
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState(kosong)
  const [editId, setEditId] = useState(null)  // null = mode tambah
  const [msg, setMsg] = useState('')
  const [livesInput, setLivesInput] = useState(3)
  const [soalInput, setSoalInput] = useState(0)
  const [msgNyawa, setMsgNyawa] = useState('')
  const [memuat, setMemuat] = useState(true)
  const [error, setError] = useState('')
  const [memuatSoal, setMemuatSoal] = useState(false)
  const [errorSoal, setErrorSoal] = useState('')

  function muatLevels() {
    setMemuat(true)
    setError('')
    client.get('/levels').then((r) => {
      setLevels(r.data)
      if (r.data.length) setLevelId(String(r.data[0].id))
    }).catch((err) => setError(err?.response?.data?.detail || 'Gagal memuat daftar level.'))
      .finally(() => setMemuat(false))
  }

  useEffect(() => { muatLevels() }, [])

  useEffect(() => {
    if (levelId) muatSoal(levelId)
  }, [levelId])

  function muatSoal(id) {
    setMemuatSoal(true)
    setErrorSoal('')
    client.get(`/dosen/levels/${id}/questions`)
      .then((r) => setQuestions(r.data))
      .catch((err) => setErrorSoal(err?.response?.data?.detail || 'Gagal memuat soal.'))
      .finally(() => setMemuatSoal(false))
  }

  // Sinkronkan input nyawa dengan level yang dipilih
  useEffect(() => {
    const lv = levels.find((l) => String(l.id) === String(levelId))
    if (lv) { setLivesInput(lv.lives); setSoalInput(lv.soal_ditanya) }
  }, [levelId, levels])

  async function simpanPengaturan() {
    setMsgNyawa('')
    try {
      const { data } = await client.put(`/dosen/levels/${levelId}`,
        { lives: Number(livesInput), soal_ditanya: Number(soalInput) })
      setLevels((ls) => ls.map((l) => (l.id === data.id
        ? { ...l, lives: data.lives, soal_ditanya: data.soal_ditanya } : l)))
      setLivesInput(data.lives); setSoalInput(data.soal_ditanya)
      setMsgNyawa('✅ Pengaturan disimpan.')
    } catch (e3) {
      setMsgNyawa('❌ ' + (e3?.response?.data?.detail || 'Gagal menyimpan pengaturan.'))
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function reset() { setForm(kosong); setEditId(null); setMsg('') }

  function mulaiEdit(q) {
    setEditId(q.id)
    setForm({
      tipe: q.tipe, q: q.q, hint: q.hint || '',
      optsText: (q.opts || []).join('\n'),
      ansText: (q.ans || []).join('\n'),
      code: q.code || '', starter: q.starter || '', expected: q.expected || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function payload() {
    const t = form.tipe
    return {
      tipe: t, q: form.q, hint: form.hint,
      opts: t === 'mc' ? splitLines(form.optsText) : null,
      ans: ['mc', 'essay', 'out', 'blank'].includes(t) ? splitLines(form.ansText) : null,
      code: ['out', 'blank'].includes(t) ? form.code : null,
      starter: t === 'code' ? form.starter : null,
      expected: t === 'code' ? form.expected : null,
    }
  }

  async function simpan(e) {
    e.preventDefault()
    setMsg('')
    try {
      if (editId) {
        await client.put(`/dosen/questions/${editId}`, payload())
        setMsg('✅ Soal diperbarui.')
      } else {
        await client.post(`/dosen/levels/${levelId}/questions`, payload())
        setMsg('✅ Soal ditambahkan.')
      }
      reset()
      muatSoal(levelId)
    } catch (e2) {
      setMsg('❌ ' + (e2?.response?.data?.detail || 'Gagal menyimpan.'))
    }
  }

  async function hapus(q) {
    if (!window.confirm(`Hapus soal "${q.q.slice(0, 40)}…" permanen? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await client.delete(`/dosen/questions/${q.id}`)
      if (editId === q.id) reset()
      muatSoal(levelId)
    } catch (err) {
      alert(err?.response?.data?.detail || 'Gagal menghapus soal.')
    }
  }

  if (user?.role !== 'dosen')
    return <p className="muted">Halaman ini khusus dosen.</p>

  if (memuat) return <p className="muted" style={{ padding: '1rem 0' }}>Memuat…</p>
  if (error)
    return (
      <div style={{ padding: '1rem 0' }}>
        <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>
        <button className="btn btn-ghost" style={{ marginTop: '.7rem' }} onClick={muatLevels}>Coba lagi</button>
      </div>
    )

  const t = form.tipe
  const opsi = splitLines(form.optsText)
  const kunci = t === 'code'
    ? (form.expected.trim() ? [form.expected.trim()] : [])
    : splitLines(form.ansText)

  return (
    <div className="fade-in">
      <h1 className="flex items-center gap-3" style={{ fontSize: '1.6rem', margin: '0 0 1rem' }}>
        <Icon name="soal" size={26} />
        <span className="grad-text">Kelola Soal</span>
      </h1>

      {/* ── Bagian atas: pemilih bab + pengaturan bab ── */}
      <div className="card" style={{ padding: '1.1rem 1.2rem', marginBottom: '1.2rem' }}>
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <label className="muted" style={{ fontSize: '.78rem', fontWeight: 600 }}>Pilih bab</label>
            <select className="input" value={levelId}
                    onChange={(e) => { setLevelId(e.target.value); reset() }}
                    style={{ marginTop: 4, fontSize: '1rem', padding: '.7rem .8rem', fontWeight: 600 }}>
              {levels.map((lv) => (
                <option key={lv.id} value={lv.id}>
                  {lv.emoji} Level {lv.urutan}: {lv.nama}{lv.is_boss ? ' (boss)' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="pill pill-accent" style={{ alignSelf: 'flex-end', marginBottom: '.15rem' }}>
            <Icon name="dokumen" size={14} />
            {questions.length} soal
          </span>

          <div style={{ alignSelf: 'flex-end', marginBottom: '.15rem' }}>
            <label className="muted" style={{ fontSize: '.78rem', fontWeight: 600, display: 'block' }}>
              <Icon name="nyawa" size={12} style={{ verticalAlign: '-2px' }} /> Nyawa
            </label>
            <input type="number" min="1" max="10" className="input" style={{ width: 84, marginTop: 4 }}
                   value={livesInput} onChange={(e) => setLivesInput(e.target.value)} />
          </div>

          <div style={{ alignSelf: 'flex-end', marginBottom: '.15rem' }}>
            <label className="muted" style={{ fontSize: '.78rem', fontWeight: 600, display: 'block' }}>
              <Icon name="ulang" size={12} style={{ verticalAlign: '-2px' }} /> Soal ditanyakan
            </label>
            <input type="number" min="0" className="input" style={{ width: 84, marginTop: 4 }}
                   value={soalInput} onChange={(e) => setSoalInput(e.target.value)} />
          </div>

          <button className="btn btn-primary" style={{ alignSelf: 'flex-end', marginBottom: '.15rem' }}
                  onClick={simpanPengaturan}>
            <Icon name="cek" size={16} /> Simpan
          </button>

          {msgNyawa && <span className="muted" style={{ fontSize: '.85rem', alignSelf: 'flex-end', marginBottom: '.6rem' }}>{msgNyawa}</span>}
        </div>
        <p className="muted" style={{ fontSize: '.78rem', margin: '.7rem 0 0' }}>
          Nyawa 1–10. <b>Soal ditanyakan</b>: <b>0 = semua soal</b>, atau isi angka
          (mis. 5) supaya tiap mahasiswa dapat 5 soal <b>acak</b> dari bank — urutannya juga diacak (anti-contek).
        </p>
      </div>

      {/* ── Dua kolom: form (kiri) + pratinjau langsung (kanan) ── */}
      <div style={{ display: 'grid', gap: '1.1rem', alignItems: 'start',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))' }}>

        {/* KIRI — FORM */}
        <form onSubmit={simpan} className="card" style={{ padding: '1.3rem' }}>
          <h3 className="section-title">Tambah / Ubah Soal</h3>
          <p className="muted" style={{ fontSize: '.8rem', margin: '.3rem 0 1rem' }}>
            {editId ? 'Sedang mengubah soal yang sudah ada.' : 'Soal baru akan ditambahkan ke bab terpilih.'}
          </p>

          <label className="muted" style={{ fontSize: '.78rem', fontWeight: 600 }}>Tipe soal</label>
          <div className="flex gap-2" style={{ flexWrap: 'wrap', margin: '.4rem 0 .2rem' }}>
            {Object.entries(TIPE_LABEL).map(([k, v]) => (
              <button key={k} type="button"
                      className={`btn btn-sm ${t === k ? 'btn-primary' : 'btn-subtle'}`}
                      onClick={() => setForm({ ...form, tipe: k })}>
                {v}
              </button>
            ))}
          </div>

          <label style={lbl}>Pertanyaan</label>
          <textarea className="input" value={form.q} onChange={set('q')} required
                    placeholder="Tulis pertanyaan di sini…"
                    style={{ marginTop: 4, minHeight: 70 }} />

          {t === 'mc' && (
            <>
              <label style={lbl}>Pilihan jawaban (tekan Enter untuk opsi berikutnya: A, B, C, D)</label>
              <textarea className="input" value={form.optsText} onChange={set('optsText')}
                        placeholder={'Ketik opsi A di baris ini, lalu Enter\nKetik opsi B di baris ini, lalu Enter\nKetik opsi C di baris ini, lalu Enter\nKetik opsi D di baris ini'}
                        style={{ marginTop: 4, minHeight: 95 }} />
            </>
          )}

          {(t === 'out' || t === 'blank') && (
            <>
              <label style={lbl}>Kode yang ditampilkan</label>
              <textarea className="input" value={form.code} onChange={set('code')}
                        placeholder={'print("Halo")'}
                        style={{ marginTop: 4, minHeight: 80, ...mono }} />
            </>
          )}

          {['mc', 'essay', 'out', 'blank'].includes(t) && (
            <>
              <label style={lbl}>
                {t === 'mc'
                  ? 'Jawaban benar (tulis persis salah satu opsi pilihan di atas)'
                  : 'Kunci jawaban benar (boleh beberapa variasi jawaban yang diterima, satu per baris)'}
              </label>
              <textarea className="input" value={form.ansText} onChange={set('ansText')} required
                        placeholder={t === 'mc' ? 'Salin/tuliskan teks opsi yang benar persis seperti di atas...' : 'Contoh variasi jawaban yang diterima:\nMonopoli\nPasar Monopoli'}
                        style={{ marginTop: 4, minHeight: 65 }} />
            </>
          )}

          {t === 'code' && (
            <>
              <label style={lbl}>Kode awal (starter)</label>
              <textarea className="input" value={form.starter} onChange={set('starter')}
                        placeholder={'# tulis kodemu di bawah ini'}
                        style={{ marginTop: 4, minHeight: 80, ...mono }} />
              <label style={lbl}>Output yang diharapkan</label>
              <textarea className="input" value={form.expected} onChange={set('expected')} required
                        style={{ marginTop: 4, minHeight: 56, ...mono }} />
            </>
          )}

          <label style={lbl}>Petunjuk (opsional)</label>
          <input className="input" value={form.hint} onChange={set('hint')}
                 placeholder="Petunjuk singkat untuk mahasiswa…" style={{ marginTop: 4 }} />

          {msg && <p style={{ margin: '.9rem 0 0', fontSize: '.88rem' }}>{msg}</p>}

          <div className="flex gap-2" style={{ marginTop: '1.1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary">
              <Icon name="cek" size={16} /> {editId ? 'Simpan perubahan' : 'Tambah soal'}
            </button>
            {editId && (
              <button type="button" className="btn btn-ghost" onClick={reset}>
                <Icon name="silang" size={16} /> Batal
              </button>
            )}
          </div>
        </form>

        {/* KANAN — PRATINJAU LANGSUNG */}
        <div className="card card-accent" style={{ padding: '1.3rem' }}>
          <h3 className="section-title">Pratinjau</h3>
          <p className="muted" style={{ fontSize: '.8rem', margin: '.3rem 0 1rem' }}>
            Beginilah soal ini akan terlihat oleh mahasiswa.
          </p>

          <span className="pill" style={{ marginBottom: '.9rem' }}>{TIPE_LABEL[t]}</span>

          <p style={{
            margin: '0 0 .9rem', fontSize: '1.02rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
            color: form.q.trim() ? 'var(--text)' : 'var(--subtext)',
            fontStyle: form.q.trim() ? 'normal' : 'italic',
          }}>
            {form.q.trim() || 'Pertanyaan akan tampil di sini…'}
          </p>

          {['out', 'blank'].includes(t) && form.code.trim() && (
            <pre className="code" style={{ margin: '0 0 .9rem' }}>{form.code}</pre>
          )}

          {t === 'mc' && (
            <div style={{ display: 'grid', gap: '.5rem', marginBottom: '.9rem' }}>
              {opsi.length === 0 ? (
                <p className="muted" style={{ fontSize: '.85rem', fontStyle: 'italic', margin: 0 }}>
                  Pilihan jawaban akan tampil di sini…
                </p>
              ) : opsi.map((o, i) => (
                <button key={i} type="button" className="btn btn-ghost"
                        style={{ justifyContent: 'flex-start', textAlign: 'left',
                                 width: '100%', ...mono, fontSize: '.9rem' }}>
                  {String.fromCharCode(65 + i)}. {o}
                </button>
              ))}
            </div>
          )}

          {['essay', 'out', 'blank'].includes(t) && (
            <input className="input" disabled
                   placeholder={t === 'essay' ? 'Mahasiswa akan mengetik jawaban di sini…' : 'Ketik jawabanmu…'}
                   style={{ marginBottom: '.9rem', ...(t === 'essay' ? {} : mono) }} />
          )}

          {t === 'code' && (
            <>
              <textarea className="input" disabled value={form.starter}
                        placeholder="# tulis kodemu di sini"
                        style={{ marginBottom: '.5rem', minHeight: 90, ...mono }} />
              <p className="muted" style={{ fontSize: '.8rem', margin: '0 0 .9rem' }}>
                Output diharapkan: <b style={mono}>{form.expected.trim() || '—'}</b>
              </p>
            </>
          )}

          {form.hint.trim() && (
            <p className="muted flex items-center gap-2"
               style={{ fontSize: '.82rem', margin: '0 0 .9rem' }}>
              <Icon name="info" size={14} /> {form.hint}
            </p>
          )}

          <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--border-soft)',
                        borderRadius: 'var(--r-lg)', padding: '.75rem .9rem' }}>
            <div className="flex items-center gap-2" style={{ fontSize: '.84rem' }}>
              <Icon name="kunci" size={14} />
              <span>
                <b>Kunci jawaban:</b>{' '}
                <span style={mono}>{kunci.length ? kunci.join(' · ') : '—'}</span>
              </span>
            </div>
            <p className="muted" style={{ fontSize: '.74rem', margin: '.35rem 0 0' }}>
              hanya terlihat oleh dosen
            </p>
          </div>
        </div>
      </div>

      {/* ── Daftar soal (lebar penuh) ── */}
      <h3 className="section-title" style={{ margin: '1.6rem 0 .8rem' }}>
        Daftar Soal ({questions.length})
      </h3>

      {memuatSoal ? (
        <div style={{ display: 'grid', gap: '.5rem' }}>
          <div className="skeleton" style={{ height: 54 }} />
          <div className="skeleton" style={{ height: 54 }} />
          <div className="skeleton" style={{ height: 54 }} />
        </div>
      ) : errorSoal ? (
        <div className="card" style={{ padding: '1.1rem 1.2rem' }}>
          <p style={{ color: 'var(--danger)', margin: 0 }}>{errorSoal}</p>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: '.6rem' }}
                  onClick={() => muatSoal(levelId)}>
            <Icon name="ulang" size={15} /> Coba lagi
          </button>
        </div>
      ) : questions.length === 0 ? (
        <div className="empty">
          <div className="empty-ico"><Icon name="soal" size={28} /></div>
          <p style={{ margin: '0 0 .3rem', fontWeight: 600 }}>Belum ada soal di bab ini</p>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Isi formulir di atas untuk menambahkan soal pertama.
          </p>
        </div>
      ) : (
        <div className="card stagger" style={{ padding: '.35rem .4rem' }}>
          {questions.map((q, i) => (
            <div key={q.id} className="row-hover flex items-center justify-between"
                 style={{ padding: '.65rem .8rem', gap: '.9rem', borderRadius: 'var(--r-lg)',
                          borderBottom: i === questions.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
              <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                <span className="muted" style={{ fontSize: '.8rem', fontWeight: 700, width: 28, flexShrink: 0 }}>
                  #{i + 1}
                </span>
                <span className="pill" style={{ flexShrink: 0 }}>{TIPE_LABEL[q.tipe] || q.tipe}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {q.q}
                </span>
              </div>
              <div className="flex gap-2" style={{ flexShrink: 0 }}>
                <button className={`btn btn-sm ${editId === q.id ? 'btn-primary' : 'btn-subtle'}`}
                        title="Ubah soal" onClick={() => mulaiEdit(q)}>
                  <Icon name="ubah" size={15} />
                </button>
                <button className="btn btn-sm btn-danger" title="Hapus soal" onClick={() => hapus(q)}>
                  <Icon name="hapus" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
