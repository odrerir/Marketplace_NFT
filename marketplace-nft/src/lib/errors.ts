import { isAxiosError } from 'axios'
import type { ApiError } from '@/types/api'

export function apiErrorOf(error: unknown): ApiError | undefined {
  return isAxiosError<ApiError>(error) ? error.response?.data : undefined
}

export function errorMessage(error: unknown): string {
  if (isAxiosError(error) && !error.response) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.'
  }
  return apiErrorOf(error)?.message ?? 'Algo deu errado. Tente novamente.'
}