import { HttpResponse } from 'msw'
import { apiError } from './auth'

export type FailureMode = 'none' | 'http500' | 'network'

const failures: Record<string, FailureMode> = {}

export function setFailure(key: string, mode: FailureMode) {
  failures[key] = mode
}

export function clearFailures() {
  for (const key of Object.keys(failures)) delete failures[key]
}

/** Resposta de falha configurada para o grupo, ou undefined quando está tudo normal. */
export function failureFor(key: string): Response | undefined {
  const mode = failures[key] ?? 'none'
  if (mode === 'http500') return apiError(500, 'TRANSIENT', 'Falha temporária. Tente novamente.')
  if (mode === 'network') return HttpResponse.error()
  return undefined
}