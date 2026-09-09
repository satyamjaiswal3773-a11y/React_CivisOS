import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api'
import { authStorage, type StoredUser } from '../lib/authStorage'
import { getErrorMessage } from '../lib/http'

type AuthContextValue = {
  user: StoredUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasAnyRole: (...roles: string[]) => boolean
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => authStorage.getUser())
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await authApi.login({ email, password })
      authStorage.setSession(result.accessToken, result.refreshToken, result.user)
      setUser(result.user)
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authStorage.clear()
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    if (!authStorage.getAccessToken()) return
    try {
      const me = await authApi.me()
      const refresh = authStorage.getRefreshToken()
      const access = authStorage.getAccessToken()
      if (access && refresh) {
        authStorage.setSession(access, refresh, me)
      }
      setUser(me)
    } catch {
      authStorage.clear()
      setUser(null)
    }
  }, [])

  const hasAnyRole = useCallback(
    (...roles: string[]) => {
      if (!user?.roles?.length) return false
      return roles.some((role) => user.roles.includes(role))
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && authStorage.getAccessToken()),
      loading,
      login,
      logout,
      hasAnyRole,
      refreshMe,
    }),
    [user, loading, login, logout, hasAnyRole, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
