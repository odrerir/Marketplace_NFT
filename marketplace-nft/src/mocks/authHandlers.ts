import { http, HttpResponse, delay } from 'msw'
import { db } from './db'
import type { StoredUser } from './db'
import { apiError, authenticate, bearerToken, createSession, hashPassword, toUser } from './auth'
import { validators } from '@/lib/validators'
import type { AuthResponse, LoginRequest, RegisterRequest, SessionResponse } from '@/types/api'

function authResponse(user: StoredUser, status: number) {
  const session = createSession(user.id)
  const body: AuthResponse = { token: session.token, user: toUser(user), expiresAt: session.expiresAt }
  return HttpResponse.json(body, { status })
}

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as Partial<RegisterRequest>
    const username = (body.username ?? '').trim()
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    const fieldErrors: Record<string, string> = {}
    const eUser = validators.username(username)
    const eMail = validators.email(email)
    const ePass = validators.password(password)
    if (eUser) fieldErrors.username = eUser
    if (eMail) fieldErrors.email = eMail
    if (ePass) fieldErrors.password = ePass
    if (Object.keys(fieldErrors).length > 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Confira os campos informados.', fieldErrors)
    }

    const conflicts: Record<string, string> = {}
    if (db.users.some((u) => u.email === email)) conflicts.email = 'Este e-mail já está cadastrado.'
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      conflicts.username = 'Este nome de usuário já está em uso.'
    }
    if (Object.keys(conflicts).length > 0) {
      return apiError(409, 'CONFLICT', 'Já existe uma conta com estes dados.', conflicts)
    }

    const salt = crypto.randomUUID()
    const user: StoredUser = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      username,
      displayName: username,
      email,
      salt,
      passwordHash: await hashPassword(salt, password),
    }
    db.update((s) => {
      s.users.push(user)
    })
    return authResponse(user, 201)
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as Partial<LoginRequest>
    const email = (body.email ?? '').trim().toLowerCase()
    const password = body.password ?? ''

    const fieldErrors: Record<string, string> = {}
    const eMail = validators.email(email)
    if (eMail) fieldErrors.email = eMail
    if (!password) fieldErrors.password = 'Informe sua senha.'
    if (Object.keys(fieldErrors).length > 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Confira os campos informados.', fieldErrors)
    }

    const user = db.users.find((u) => u.email === email)
    const valid = user && (await hashPassword(user.salt, password)) === user.passwordHash
    if (!user || !valid) {
      return apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }
    return authResponse(user, 200)
  }),

  http.get('/api/auth/session', async ({ request }) => {
    await delay(150)
    const auth = authenticate(request)
    if ('error' in auth) return auth.error
    const session = db.sessions.find((s) => s.token === auth.token)
    const body: SessionResponse = { user: toUser(auth.user), expiresAt: session?.expiresAt ?? '' }
    return HttpResponse.json(body)
  }),

  // Idempotente: sair com um token já expirado também devolve 204.
  http.post('/api/auth/logout', async ({ request }) => {
    const token = bearerToken(request)
    db.update((s) => {
      s.sessions = s.sessions.filter((x) => x.token !== token)
    })
    return new HttpResponse(null, { status: 204 })
  }),
]