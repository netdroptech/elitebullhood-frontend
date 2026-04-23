import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from '../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:          string
  email:       string
  firstName:   string
  lastName:    string
  phone?:      string
  country?:    string
  avatarUrl?:  string
  status:      string
  kycStatus:   string
  plan:        string
  balance:     number
  totalDeposits:    number
  totalWithdrawals: number
  totalProfit:      number
  emailVerified:    boolean
  createdAt:   string
  lastLoginAt?: string
}

interface AuthContextType {
  user:          AuthUser | null
  isLoading:     boolean
  isAuthenticated: boolean
  login:         (email: string, password: string) => Promise<void>
  logout:        () => Promise<void>
  refreshUser:   () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Bootstrap – restore session on page load
  useEffect(() => {
    const token = localStorage.getItem('apex_token')
    if (token) {
      fetchMe().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }

    // Listen for forced logout (e.g. 401 from api.ts)
    const onLogout = () => { setUser(null) }
    window.addEventListener('apex:logout', onLogout)
    return () => window.removeEventListener('apex:logout', onLogout)
  }, [])

  async function fetchMe() {
    try {
      const res = await api.get<{ success: boolean; data: AuthUser }>('/auth/me')
      setUser(res.data)
    } catch {
      setUser(null)
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post<{
      success: boolean
      data: { accessToken: string; refreshToken: string; user: AuthUser }
    }>('/auth/login', { email, password })

    localStorage.setItem('apex_token',   res.data.accessToken)
    localStorage.setItem('apex_refresh', res.data.refreshToken)
    setUser(res.data.user)
  }

  async function logout() {
    const refresh = localStorage.getItem('apex_refresh')
    try { await api.post('/auth/logout', { refreshToken: refresh }) } catch {}
    localStorage.removeItem('apex_token')
    localStorage.removeItem('apex_refresh')
    setUser(null)
  }

  async function refreshUser() {
    await fetchMe()
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
