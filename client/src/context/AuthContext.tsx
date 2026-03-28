import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, setToken } from '../api/client'

export type User = {
  id: string
  email: string
  displayName: string
  phoneNumber?: string
  dateOfBirth?: string | null
  gender?: string
  isAdmin: boolean
  isVip: boolean
  vipExpiresAt: string | null
}

type AuthState = {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName?: string, adminSecret?: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
  isVipActive: () => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = useCallback(async () => {
    try {
      const me = await api<User>('/api/auth/me')
      setUser(me)
    } catch {
      setUser(null)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = localStorage.getItem('phimhay_token')
    if (!t) {
      setLoading(false)
      return
    }
    refreshMe()
  }, [refreshMe])

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      json: { identifier, password },
    })
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName?: string, adminSecret?: string) => {
      const data = await api<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        headers: adminSecret ? { 'x-admin-secret': adminSecret } : undefined,
        json: { email, password, displayName },
      })
      setToken(data.token)
      setUser(data.user)
    },
    []
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const isVipActive = useCallback(() => {
    if (!user?.isVip) return false
    if (!user.vipExpiresAt) return true
    return new Date(user.vipExpiresAt).getTime() > Date.now()
  }, [user])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshMe,
      isVipActive,
    }),
    [user, loading, login, register, logout, refreshMe, isVipActive]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth trong AuthProvider')
  return ctx
}
