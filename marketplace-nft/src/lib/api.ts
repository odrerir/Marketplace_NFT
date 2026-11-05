import axios, { isAxiosError } from 'axios'
import { clearToken, emitSessionExpired, getToken } from './session'
import type { ApiError } from '@/types/api'
import { getGuestId } from './guest'

export const api = axios.create({ baseURL: '/api', timeout: 10_000 })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  config.headers.set('X-Guest-Id', getGuestId())
  return config
})

// 401 com sessão ativa = sessão expirada. (Senha errada vem como INVALID_CREDENTIALS e não entra aqui.)
api.interceptors.response.use(undefined, (error: unknown) => {
  if (
    isAxiosError<ApiError>(error) &&
    error.response?.status === 401 &&
    error.response.data?.code === 'UNAUTHENTICATED' &&
    getToken()
  ) {
    clearToken()
    emitSessionExpired()
  }
  return Promise.reject(error)
})