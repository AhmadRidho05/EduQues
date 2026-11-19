import axios from 'axios'

// Gunakan URL dari .env jika ada (misal saat deploy), fallback ke localhost untuk development
const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// Semua panggilan API lewat sini.
const client = axios.create({
  baseURL: API_URL,
})

// Sisipkan token login otomatis di setiap request (kalau ada).
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Tangani respons error global (401 kadaluwarsa & 409 belum pilih kelas)
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status

    // 1. Jika token kedaluwarsa / tidak valid (401), bersihkan sesi dan redirect ke login
    if (status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(err)
    }

    // 2. Kalau backend bilang "belum pilih kelas" (409), arahkan ke Profil
    if (status === 409 && !window.location.pathname.startsWith('/profil')) {
      sessionStorage.setItem(
        'kelasHint',
        err?.response?.data?.detail || 'Pilih kelas dulu untuk membuka menu ini.'
      )
      window.location.href = '/profil'
    }

    return Promise.reject(err)
  }
)

export default client