// Menjalankan Python langsung di browser lewat Pyodide (WebAssembly).
// Pyodide dimuat dari CDN sekali saja (± beberapa detik pertama kali).

const PYODIDE_VERSION = 'v0.27.2'
const BASE = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

let pyodidePromise = null

export function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = BASE + 'pyodide.js'
          s.onload = resolve
          s.onerror = () =>
            reject(new Error('Gagal memuat Pyodide — cek koneksi internet.'))
          document.head.appendChild(s)
        })
      }
      return window.loadPyodide({ indexURL: BASE })
    })()
  }
  return pyodidePromise
}

// Jalankan kode Python; kembalikan gabungan stdout + error (seperti terminal).
// Aman: exec di namespace kosong, output & traceback ditangkap ke string.
export async function runPython(code) {
  const py = await getPyodide()
  py.globals.set('__user_code__', code)
  const out = await py.runPythonAsync(`
import io, contextlib, traceback
__buf = io.StringIO()
try:
    with contextlib.redirect_stdout(__buf), contextlib.redirect_stderr(__buf):
        exec(__user_code__, {})
except Exception:
    __buf.write(traceback.format_exc())
__buf.getvalue()
`)
  return out
}
