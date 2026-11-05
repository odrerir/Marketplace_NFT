import { HttpResponse } from 'msw'
import { db } from './db'
import type { StoredUser } from './db'
import type { ApiError, ApiErrorCode, User } from '@/types/api'

export const SESSION_TTL_MS = 30 * 60_000

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Hash de demonstração (sal + SHA-256). Um backend real usaria bcrypt ou argon2. */
export const hashPassword = (salt: string, password: string) => sha256Hex(`${salt}:${password}`)

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  const body: ApiError = { code, message, fieldErrors }
  return HttpResponse.json(body, { status })
}

export function toUser(u: StoredUser): User {
  return { id: u.id, username: u.username, displayName: u.displayName, email: u.email }
}

export function createSession(userId: string) {
  const session = {
    token: crypto.randomUUID(),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.update((s) => {
    s.sessions.push(session)
  })
  return session
}

export function bearerToken(request: Request): string {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

/** Devolve o usuário da sessão, ou a resposta 401 pronta. Usado por todas as rotas privadas. */
export function authenticate(
  request: Request,
): { user: StoredUser; token: string } | { error: Response } {
  const token = bearerToken(request)
  const session = db.sessions.find((s) => s.token === token)
  const expired = !session || new Date(session.expiresAt) <= new Date()
  const user = session && !expired ? db.users.find((u) => u.id === session.userId) : undefined

  if (!user) {
    if (session) {
      db.update((s) => {
        s.sessions = s.sessions.filter((x) => x.token !== token)
      })
    }
    return { error: apiError(401, 'UNAUTHENTICATED', 'Sua sessão expirou. Entre novamente.') }
  }
  return { user, token }
}