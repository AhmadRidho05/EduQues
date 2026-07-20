import { useEffect, useState } from 'react'
import client from '../api/client'
import { useAuth } from '../context/AuthContext'

const TIPE_LABEL = {
  mc: 'Pilihan ganda', out: 'Tebak output',
  blank: 'Lengkapi kode', code: 'Tulis kode',
}
const kosong = { tipe: 'mc', q: '', hint: '', optsText: '', ansText: '', code: '', starter: '', expected: '' }
const splitLines = (t) => t.split('\n').map((s) => s.trim()).filter(Boolean)

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

  useEffect(() => {
    client.get('/levels').then((r) => {
      setLevels(r.data)
      if (r.data.length) setLevelId(String(r.data[0].id))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (levelId) muatSoal(levelId)
  }, [levelId])

  function muatSoal(id) {
    client.get(`/dosen/levels/${id}/questions`)
      .then((r) => setQuestions(r.data)).catch(() => {})
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
    } catch {
      setMsgNyawa('❌ Gagal menyimpan.')
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
      ans: ['mc', 'out', 'blank'].includes(t) ? splitLines(form.ansText) : null,
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
    if (!window.confirm(`Hapus soal: "${q.q.slice(0, 40)}…"?`)) return
    await client.delete(`/dosen/questions/${q.id}`)
    if (editId === q.id) reset()
    muatSoal(levelId)
  }

  if (user?.role !== 'dosen')
    return <p className="muted">Halaman ini khusus dosen.</p>

  const t = form.tipe

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>📝 Kelola Soal</h1>

      <label className="muted" style={{ fontSize: '.85rem' }}>Pilih level</label>
      <select className="input" value={levelId} onChange={(e) => { setLevelId(e.target.value); reset() }}
              style={{ maxWidth: 320, margin: '.3rem 0 1.4rem' }}>
        {levels.map((lv) => (
          <option key={lv.id} value={lv.id}>
            {lv.emoji} Level {lv.urutan}: {lv.nama}{lv.is_boss ? ' (boss)' : ''}
          </option>
        ))}
      </select>

      {/* Pengaturan level: nyawa + jumlah soal acak */}
      <div className="card" style={{ padding: '1.1rem 1.2rem', marginBottom: '1.4rem' }}>
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <span>❤️ <b>Nyawa</b>:</span>
          <input type="number" min="1" max="10" className="input" style={{ width: 80 }}
                 value={livesInput} onChange={(e) => setLivesInput(e.target.value)} />
          <span style={{ marginLeft: '.6rem' }}>🔀 <b>Soal ditanyakan</b>:</span>
          <input type="number" min="0" className="input" style={{ width: 80 }}
                 value={soalInput} onChange={(e) => setSoalInput(e.target.value)} />
          <button className="btn btn-primary" style={{ padding: '.45rem .9rem' }}
                  onClick={simpanPengaturan}>Simpan</button>
          {msgNyawa && <span className="muted" style={{ fontSize: '.85rem' }}>{msgNyawa}</span>}
        </div>
        <p className="muted" style={{ fontSize: '.78rem', margin: '.55rem 0 0' }}>
          Nyawa 1–10. <b>Soal ditanyakan</b>: <b>0 = semua soal</b>, atau isi angka
          (mis. 5) supaya tiap mahasiswa dapat 5 soal <b>acak</b> dari bank — urutannya juga diacak (anti-contek).
        </p>
      </div>

      {/* Form tambah / edit */}
      <form onSubmit={simpan} className="card" style={{ padding: '1.4rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>{editId ? '✏️ Edit soal' : '➕ Tambah soal'}</h3>

        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: '.82rem' }}>Tipe soal</label>
            <select className="input" value={form.tipe} onChange={set('tipe')} style={{ marginTop: 4 }}>
              {Object.entries(TIPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <label style={{ fontSize: '.82rem', marginTop: '.8rem', display: 'block' }}>Pertanyaan</label>
        <textarea className="input" value={form.q} onChange={set('q')} required
                  style={{ marginTop: 4, minHeight: 60 }} />

        {t === 'mc' && (
          <>
            <label style={{ fontSize: '.82rem', marginTop: '.8rem', display: 'block' }}>
              Pilihan jawaban (satu per baris)</label>
            <textarea className="input" value={form.optsText} onChange={set('optsText')}
                      placeholder={'print\necho\nshow'} style={{ marginTop: 4, minHeight: 80,
                      fontFamily: 'Consolas, monospace' }} />
          </>
        )}

        {(t === 'out' || t === 'blank') && (
          <>
            <label style={{ fontSize: '.82rem', marginTop: '.8rem', display: 'block' }}>
              Kode yang ditampilkan</label>
            <textarea className="input" value={form.code} onChange={set('code')}
                      style={{ marginTop: 4, minHeight: 70, fontFamily: 'Consolas, monospace' }} />
          </>
        )}

        {['mc', 'out', 'blank'].includes(t) && (
          <>
            <label style={{ fontSize: '.82rem', marginTop: '.8rem', display: 'block' }}>
              Jawaban benar (satu per baris — boleh beberapa yang diterima)</label>
            <textarea className="input" value={form.ansText} onChange={set('ansText')} required
                      placeholder={'print'} style={{ marginTop: 4, minHeight: 50,
                      fontFamily: 'Consolas, monospace' }} />
          </>
        )}

        {t === 'code' && (
          <>
            <label style={{ fontSize: '.82rem', marginTop: '.8rem', display: 'block' }}>Kode awal (starter)</label>
            <textarea className="input" value={form.starter} onChange={set('starter')}
                      style={{ marginTop: 4, minHeight: 70, fontFamily: 'Consolas, monospace' }} />
            <label style={{ fontSize: '.82rem', marginTop: '.8rem', display: 'block' }}>
              Output yang diharapkan</label>
            <textarea className="input" value={form.expected} onChange={set('expected')} required
                      style={{ marginTop: 4, minHeight: 50, fontFamily: 'Consolas, monospace' }} />
          </>
        )}

        <label style={{ fontSize: '.82rem', marginTop: '.8rem', display: 'block' }}>Petunjuk (opsional)</label>
        <input className="input" value={form.hint} onChange={set('hint')} style={{ marginTop: 4 }} />

        {msg && <p style={{ marginTop: '.8rem' }}>{msg}</p>}
        <div className="flex gap-3" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary">{editId ? 'Simpan perubahan' : 'Tambah soal'}</button>
          {editId && <button type="button" className="btn btn-ghost" onClick={reset}>Batal</button>}
        </div>
      </form>

      {/* Daftar soal */}
      <h3>Daftar soal ({questions.length})</h3>
      {questions.length === 0 && <p className="muted">Belum ada soal di level ini.</p>}
      {questions.map((q, i) => (
        <div key={q.id} className="card flex items-center justify-between"
             style={{ padding: '.9rem 1.1rem', marginBottom: '.6rem', gap: '1rem' }}>
          <div style={{ minWidth: 0 }}>
            <span className="muted" style={{ fontSize: '.75rem' }}>
              #{i + 1} · {TIPE_LABEL[q.tipe]}
            </span>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.q}</div>
          </div>
          <div className="flex gap-2" style={{ flexShrink: 0 }}>
            <button className="btn btn-ghost" style={{ padding: '.35rem .7rem', fontSize: '.82rem' }}
                    onClick={() => mulaiEdit(q)}>Edit</button>
            <button className="btn btn-ghost" style={{ padding: '.35rem .7rem', fontSize: '.82rem',
                    color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => hapus(q)}>Hapus</button>
          </div>
        </div>
      ))}
    </div>
  )
}
