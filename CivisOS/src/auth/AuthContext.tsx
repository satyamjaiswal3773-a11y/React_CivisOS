import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi } from '../api'
import { authStorage, type StoredUser } from '../lib/authStorage'
import { getErrorMessage } from '../lib/http'
import type { AppPageDto, MyAccessDto } from '../types/api'

type AuthContextValue = {
  user: StoredUser | null
  access: MyAccessDto | null
  isAuthenticated: boolean
  loading: boolean
  accessLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasAnyRole: (...roles: string[]) => boolean
  hasPermission: (...codes: string[]) => boolean
  refreshMe: () => Promise<void>
  refreshAccess: () => Promise<void>
  pages: AppPageDto[]
  permissions: string[]
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => authStorage.getUser())
  const [access, setAccess] = useState<MyAccessDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [accessLoading, setAccessLoading] = useState(() => Boolean(authStorage.getAccessToken()))

  const refreshAccess = useCallback(async () => {
    if (!authStorage.getAccessToken()) {
      setAccess(null)
      setAccessLoading(false)
      return
    }
    setAccessLoading(true)
    try {
      const data = await authApi.myAccess()
      setAccess(data)
      setUser((prev) => {
        const next: StoredUser = {
          id: data.userId || prev?.id || '',
          email: data.email || prev?.email || '',
          firstName: data.firstName || prev?.firstName || '',
          lastName: data.lastName || prev?.lastName || '',
          phoneNumber: prev?.phoneNumber,
          roles: data.roles?.length ? data.roles : prev?.roles || [],
        }
        const refresh = authStorage.getRefreshToken()
        const token = authStorage.getAccessToken()
        if (token && refresh) authStorage.setSession(token, refresh, next)
        return next
      })
    } catch {
      setAccess(null)
    } finally {
      setAccessLoading(false)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        const result = await authApi.login({ email, password })
        authStorage.setSession(result.accessToken, result.refreshToken, result.user)
        setUser(result.user)
        await refreshAccess()
      } catch (error) {
        throw new Error(getErrorMessage(error, 'Login failed.'))
      } finally {
        setLoading(false)
      }
    },
    [refreshAccess],
  )

  const logout = useCallback(() => {
    authStorage.clear()
    setUser(null)
    setAccess(null)
    setAccessLoading(false)
  }, [])

  const refreshMe = useCallback(async () => {
    if (!authStorage.getAccessToken()) return
    try {
      const me = await authApi.me()
      const refresh = authStorage.getRefreshToken()
      const accessToken = authStorage.getAccessToken()
      if (accessToken && refresh) {
        authStorage.setSession(accessToken, refresh, me)
      }
      setUser(me)
      await refreshAccess()
    } catch {
      authStorage.clear()
      setUser(null)
      setAccess(null)
    }
  }, [refreshAccess])

  useEffect(() => {
    if (authStorage.getAccessToken()) {
      void refreshAccess()
    }
  }, [refreshAccess])

  const hasAnyRole = useCallback(
    (...roles: string[]) => {
      const current = access?.roles?.length ? access.roles : user?.roles
      if (!current?.length) return false
      return roles.some((role) => current.includes(role))
    },
    [access, user],
  )

  const hasPermission = useCallback(
    (...codes: string[]) => {
      if (!codes.length) return true
      const perms = access?.permissions ?? []
      if (!perms.length) return false
      return codes.some((code) => perms.includes(code))
    },
    [access],
  )

  const value = useMemo(
    () => ({
      user,
      access,
      isAuthenticated: Boolean(user && authStorage.getAccessToken()),
      loading,
      accessLoading,
      login,
      logout,
      hasAnyRole,
      hasPermission,
      refreshMe,
      refreshAccess,
      pages: access?.pages ?? [],
      permissions: access?.permissions ?? [],
    }),
    [
      user,
      access,
      loading,
      accessLoading,
      login,
      logout,
      hasAnyRole,
      hasPermission,
      refreshMe,
      refreshAccess,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
