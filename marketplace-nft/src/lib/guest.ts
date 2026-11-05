const KEY = 'kurio:guest-id'
let memoryId: string | null = null

/** Identifica o visitante, para o carrinho sobreviver a um refresh antes do login. */
export function getGuestId(): string {
  if (memoryId) return memoryId
  try {
    const stored = localStorage.getItem(KEY)
    if (stored) {
      memoryId = stored
      return stored
    }
  } catch {
    // sem storage: o id vale só até recarregar
  }
  const id = crypto.randomUUID()
  memoryId = id
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // ignora
  }
  return id
}