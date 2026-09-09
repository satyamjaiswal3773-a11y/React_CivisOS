const ACCESS_KEY = 'civisos.accessToken'
const REFRESH_KEY = 'civisos.refreshToken'
const USER_KEY = 'civisos.user'

export type StoredUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  roles: string[]
}

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUser: (): StoredUser | null => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  },
  setSession: (accessToken: string, refreshToken: string, user: StoredUser) => {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
