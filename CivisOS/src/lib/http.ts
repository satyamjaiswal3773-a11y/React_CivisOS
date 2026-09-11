import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, AuthResponse } from '../types/api'
import { authStorage } from './authStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const http = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const accessToken = authStorage.getAccessToken()
  const refreshToken = authStorage.getRefreshToken()
  if (!accessToken || !refreshToken) return null

  try {
    const { data } = await axios.post<ApiResponse<AuthResponse>>(
      `${baseURL}/api/v1/auth/refresh`,
      { accessToken, refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    )
    if (!data.success || !data.data) {
      authStorage.clear()
      return null
    }
    authStorage.setSession(data.data.accessToken, data.data.refreshToken, data.data.user)
    return data.data.accessToken
  } catch {
    authStorage.clear()
    return null
  }
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return http(original)
      }
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined
    if (data?.errors?.length) return data.errors.join(' ')
    if (data?.message) return data.message
    if (error.message) return error.message
  }
  if (error instanceof Error) return error.message
  return fallback
}

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise
  if (!data.success || data.data === undefined || data.data === null) {
    throw new Error(data.message || data.errors?.join(' ') || 'Request failed.')
  }
  return data.data
}

/** Like unwrap, but allows null data and returns the API message (for save endpoints). */
export async function unwrapResult<T>(
  promise: Promise<{ data: ApiResponse<T> }>,
): Promise<{ data: T | null; message?: string | null }> {
  const { data } = await promise
  if (!data.success) {
    throw new Error(data.message || data.errors?.join(' ') || 'Request failed.')
  }
  return { data: data.data ?? null, message: data.message }
}

export function isForbiddenError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 403
}
