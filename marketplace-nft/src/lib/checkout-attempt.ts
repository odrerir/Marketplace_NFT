const KEY = 'kurio:checkout-attempt'

interface Attempt {
  key: string
  fingerprint: string
}

let memory: Attempt | null = null

function read(): Attempt | null {
  if (memory) return memory
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Attempt) : null
  } catch {
    return null
  }
}

export function peekAttempt(): Attempt | null {
  return read()
}

export function getAttemptKey(fingerprint: string): string {
  const current = read()
  if (current && current.fingerprint === fingerprint) return current.key
  const next: Attempt = { key: crypto.randomUUID(), fingerprint }
  memory = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // sem storage: vale até recarregar
  }
  return next.key
}

export function clearAttempt(): void {
  memory = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignora
  }
}