import { HttpResponse } from 'msw'
import { apiError } from './auth'

export type FailureMode = 'none' | 'http500' | 'network'

const failures: Record<string, FailureMode> = {}
const options: Record<string, string> = {}

export function setFailure(key: string, mode: FailureMode) {
  failures[key] = mode
}

export function setOption(key: string, value: string) {
  options[key] = value
}

export function getOption(key: string, fallback: string): string {
  return options[key] ?? fallback
}

/** Opção de uso único: devolve true uma vez e volta ao padrão. */
export function consumeOption(key: string, value: string): boolean {
  if (options[key] !== value) return false
  delete options[key]
  return true
}

export function clearFailures() {
  for (const key of Object.keys(failures)) delete failures[key]
  for (const key of Object.keys(options)) delete options[key]
}

/** Resposta de falha configurada para o grupo, ou undefined quando está tudo normal. */
export function failureFor(key: string): Response | undefined {
  const mode = failures[key] ?? 'none'
  if (mode === 'http500') return apiError(500, 'TRANSIENT', 'Falha temporária. Tente novamente.')
  if (mode === 'network') return HttpResponse.error()
  return undefined
}