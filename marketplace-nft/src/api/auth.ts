import { queryOptions } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { clearToken, getToken } from '@/lib/session'
import type { AuthResponse, LoginRequest, RegisterRequest, SessionResponse, User } from '@/types/api'

export async function login(body: LoginRequest) {
  const { data } = await api.post<AuthResponse>('/auth/login', body)
  return data
}

export async function register(body: RegisterRequest) {
  const { data } = await api.post<AuthResponse>('/auth/register', body)
  return data
}

export async function logout() {
  await api.post('/auth/logout')
}

export async function fetchSession() {
  const { data } = await api.get<SessionResponse>('/auth/session')
  return data
}

/** Resolve para o usuário logado, ou null (sem token ou sessão inválida). */
export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: ['session'] as const,
    queryFn: async (): Promise<User | null> => {
      if (!getToken()) return null
      try {
        return (await fetchSession()).user
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          clearToken()
          return null
        }
        throw error
      }
    },
    staleTime: 5 * 60_000,
  })