import axios from 'axios'

// Semua panggilan API lewat sini. baseURL menunjuk ke backend FastAPI.
const client = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

// Sisipkan token login otomatis di setiap request (kalau ada).
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Kalau backend bilang "belum pilih kelas" (409), arahkan ke halaman Kelas.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 409 &&
        !window.location.pathname.startsWith('/profil')) {
      window.location.href = '/profil'
    }
    return Promise.reject(err)
  }
)

export default client
