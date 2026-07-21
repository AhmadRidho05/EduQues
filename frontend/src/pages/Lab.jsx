import { useState } from 'react'
import { runPython } from '../pyodide'
import Icon from '../components/Icon'

const CONTOH = `# Coba bebas di sini! Contoh:
nama = "Python"
for i in range(3):
    print("Halo", nama, i)

print("2 pangkat 10 =", 2 ** 10)
`

const TITIK = ['#FF5F57', '#FEBC2E', '#28C840']  // titik jendela ala editor

export default function Lab() {
  const [code, setCode] = useState(CONTOH)
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)

  async function jalankan() {
    if (running) return
    setRunning(true)
    setOutput('⏳ Menyiapkan Python & menjalankan… (pertama kali agak lama)')
    try {
      const out = await runPython(code)
      setOutput(out || '(tidak ada output)')
    } catch (e) {
      setOutput('Gagal: ' + (e.message || e))
    } finally {
      setRunning(false)
    }
  }

  const gagal = output.startsWith('Gagal:')
  const adaError = /Traceback|Error/.test(output) && !output.startsWith('⏳')

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between gap-3" style={{ flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', margin: 0 }}>
            <span className="grad-text">Lab Kode</span>
          </h1>
          <p className="muted" style={{ margin: '.2rem 0 0', fontSize: '.9rem' }}>
            Tempat bereksperimen bebas — tulis Python apa saja lalu jalankan.
          </p>
        </div>
        <span className="pill pill-accent" style={{ fontSize: '.78rem' }}>
          <Icon name="kunci" size={13} />
          Dijalankan di peramban (aman)
        </span>
      </div>

      {/* Editor bergaya jendela IDE */}
      <div className="card" style={{ marginTop: '1.1rem', overflow: 'hidden', padding: 0 }}>
        <div className="flex items-center gap-2"
             style={{ padding: '.6rem .9rem', borderBottom: '1px solid var(--border)',
                      background: 'var(--card-2)' }}>
          <span className="flex items-center gap-1">
            {TITIK.map((w) => (
              <i key={w} style={{ width: 10, height: 10, borderRadius: '50%',
                                  background: w, display: 'inline-block' }} />
            ))}
          </span>
          <span className="muted flex items-center gap-1"
                style={{ fontSize: '.8rem', fontFamily: 'Consolas, monospace', marginLeft: '.4rem' }}>
            <Icon name="dokumen" size={13} /> main.py
          </span>
          <span className="muted" style={{ marginLeft: 'auto', fontSize: '.75rem' }}>
            {code.split('\n').length} baris
          </span>
        </div>

        <textarea
          value={code}
          spellCheck={false}
          onChange={(e) => setCode(e.target.value)}
          style={{
            width: '100%', border: 'none', outline: 'none', resize: 'vertical',
            background: 'var(--code-bg)', color: 'var(--code-fg)',
            fontFamily: 'Consolas, monospace', minHeight: 250, whiteSpace: 'pre',
            lineHeight: 1.6, padding: '1rem 1.1rem', fontSize: '.9rem', display: 'block',
          }}
        />

        <div className="flex items-center gap-2"
             style={{ padding: '.75rem .9rem', borderTop: '1px solid var(--border)',
                      background: 'var(--card-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={jalankan} disabled={running}>
            <Icon name={running ? 'waktu' : 'kanan'} size={15} />
            {running ? 'Menjalankan…' : 'Jalankan'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setOutput('')} disabled={running}>
            <Icon name="silang" size={14} /> Bersihkan
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCode(CONTOH)} disabled={running}>
            <Icon name="ulang" size={14} /> Contoh
          </button>
        </div>
      </div>

      {/* Keluaran */}
      {output ? (
        <div className="card" style={{ marginTop: '1rem', overflow: 'hidden', padding: 0 }}>
          <div className="flex items-center gap-2"
               style={{ padding: '.55rem .9rem', borderBottom: '1px solid var(--border)',
                        background: 'var(--card-2)' }}>
            <span style={{ color: adaError || gagal ? 'var(--danger)' : 'var(--success)',
                           display: 'flex' }}>
              <Icon name={adaError || gagal ? 'info' : 'cek'} size={15} />
            </span>
            <span style={{ fontSize: '.82rem', fontWeight: 600 }}>Output</span>
            {adaError && !gagal && (
              <span className="pill" style={{ marginLeft: 'auto', fontSize: '.72rem',
                                              color: 'var(--danger)' }}>ada error</span>
            )}
          </div>
          <pre className="code" style={{ margin: 0, borderRadius: 0, border: 'none' }}>{output}</pre>
        </div>
      ) : (
        <div className="empty" style={{ marginTop: '1rem' }}>
          <div className="empty-ico"><Icon name="lab" size={24} /></div>
          <p className="muted" style={{ margin: 0, fontSize: '.88rem' }}>
            Belum ada output. Tekan <b>Jalankan</b> untuk mengeksekusi kodemu.
          </p>
        </div>
      )}
    </div>
  )
}
