import { createContext, useContext, useState } from 'react'
import client from '../api/client'

// Menyimpan siapa yang sedang login + fungsi login/daftar/keluar.
// Data disimpan di localStorage agar tetap login setelah refresh.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  function save(token, u) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  async function login(email, password) {
    // Backend memakai form OAuth2: field 'username' diisi email.
    const form = new URLSearchParams({ username: email, password })
    const { data } = await client.post('/auth/login', form)
    save(data.access_token, data.user)
    return data.user
  }

  async function register(payload) {
    const { data } = await client.post('/auth/register', payload)
    save(data.access_token, data.user)
    return data.user
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
