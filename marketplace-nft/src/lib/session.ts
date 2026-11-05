// Chave própria, para não colidir com outros projetos em localhost:5173
const KEY = 'kurio:session-token'
let memoryToken: string | null = null

export function getToken(): string | null {
  if (memoryToken) return memoryToken
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  memoryToken = token
  try {
    localStorage.setItem(KEY, token)
  } catch {
    // sem storage: a sessão dura só até recarregar
  }
}

export function clearToken(): void {
  memoryToken = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignora
  }
}

const events = new EventTarget()
export const emitSessionExpired = () => events.dispatchEvent(new Event('expired'))
export function onSessionExpired(callback: () => void): () => void {
  events.addEventListener('expired', callback)
  return () => events.removeEventListener('expired', callback)
}