import { useState } from 'react'
import { runPython } from '../pyodide'

const CONTOH = `# Coba bebas di sini! Contoh:
nama = "Python"
for i in range(3):
    print("Halo", nama, i)

print("2 pangkat 10 =", 2 ** 10)
`

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

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem' }}>🧪 Lab Kode</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Tempat bereksperimen bebas. Tulis Python apa saja lalu jalankan —
        kodenya dijalankan langsung di browser-mu (aman).
      </p>

      <textarea
        className="input"
        value={code}
        spellCheck={false}
        onChange={(e) => setCode(e.target.value)}
        style={{ fontFamily: 'Consolas, monospace', minHeight: 220, whiteSpace: 'pre',
                 lineHeight: 1.5, marginTop: '.5rem' }}
      />

      <div className="flex gap-3" style={{ marginTop: '.8rem' }}>
        <button className="btn btn-primary" onClick={jalankan} disabled={running}>
          {running ? '⏳ Menjalankan…' : '▶ Jalankan'}
        </button>
        <button className="btn btn-ghost" onClick={() => setOutput('')} disabled={running}>
          Bersihkan output
        </button>
      </div>

      {output && (
        <div style={{ marginTop: '1rem' }}>
          <div className="muted" style={{ fontSize: '.8rem', marginBottom: 4 }}>Output:</div>
          <pre className="code">{output}</pre>
        </div>
      )}
    </div>
  )
}
