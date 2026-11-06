import { http, HttpResponse, delay } from 'msw'
import { db } from './db'
import { apiError, authenticate } from './auth'
import { failureFor, getOption } from './scenarios'
import { validators } from '@/lib/validators'
import type { Wallet, WalletConnection, WalletInput, WalletProvider } from '@/types/api'

const NETWORKS = ['ethereum', 'polygon', 'solana']
const PROVIDERS: WalletProvider[] = ['metamask', 'walletconnect', 'coinbase']

function toWallet(w: Wallet & { userId?: string }): Wallet {
  return { id: w.id, kind: w.kind, nickname: w.nickname, network: w.network, address: w.address }
}

function validateWallet(body: Partial<WalletInput>) {
  const errors: Record<string, string> = {}
  const nickname = typeof body.nickname === 'string' ? body.nickname : ''
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  const network = typeof body.network === 'string' ? body.network : ''
  const eNick = validators.nickname(nickname)
  if (eNick) errors.nickname = eNick
  if (!NETWORKS.includes(network)) errors.network = 'Selecione uma rede.'
  else {
    const eAddr = validators.walletAddress(address, network)
    if (eAddr) errors.address = eAddr
  }
  return errors
}

export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    await delay(200)
    const auth = authenticate(request)
    if ('error' in auth) return auth.error
    const items = db.wallets.filter((w) => w.userId === auth.user.id).map(toWallet)
    return HttpResponse.json({ items })
  }),

  http.post('/api/wallets', async ({ request }) => {
    await delay(400)
    const failure = failureFor('wallets')
    if (failure) return failure
    const auth = authenticate(request)
    if ('error' in auth) return auth.error

    const body = (await request.json()) as Partial<WalletInput>
    const errors = validateWallet(body)
    if (body.kind !== 'primary' && body.kind !== 'secondary') {
      errors.kind = 'Tipo de carteira inválido.'
    }

    if (Object.keys(errors).length > 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Confira os campos informados.', errors)
    }

    const kind = body.kind
    if (!kind) {
      return apiError(400, 'VALIDATION_ERROR', 'Tipo de carteira obrigatório.', {
        kind: 'Tipo de carteira obrigatório.',
      })
    }

    if (db.wallets.some((w) => w.userId === auth.user.id && w.kind === body.kind)) {
      const label = body.kind === 'primary' ? 'principal' : 'secundária'
      return apiError(409, 'CONFLICT', `Você já tem uma carteira ${label}.`, { kind: `Já existe uma carteira ${label}.` })
    }
    const wallet = {
      id: `wallet-${crypto.randomUUID().slice(0, 8)}`,
      userId: auth.user.id,
      kind,
      nickname: (body.nickname ?? '').trim(),
      network: body.network!,
      address: (body.address ?? '').trim(),
    }
    db.update((s) => {
      s.wallets.push(wallet)
    })
    return HttpResponse.json(toWallet(wallet), { status: 201 })
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    await delay(400)
    const failure = failureFor('wallets')
    if (failure) return failure
    const auth = authenticate(request)
    if ('error' in auth) return auth.error

    const wallet = db.wallets.find((w) => w.id === String(params.id) && w.userId === auth.user.id)
    if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    const body = (await request.json()) as Partial<WalletInput>
    const errors = validateWallet(body)
    if (Object.keys(errors).length > 0) return apiError(400, 'VALIDATION_ERROR', 'Confira os campos informados.', errors)

    db.update((s) => {
      const row = s.wallets.find((w) => w.id === wallet.id)
      if (!row) return
      row.nickname = (body.nickname ?? '').trim()
      row.network = body.network!
      row.address = (body.address ?? '').trim()
    })
    const updated = db.wallets.find((w) => w.id === wallet.id)!
    return HttpResponse.json(toWallet(updated))
  }),

  // Conectar é idempotente: a mesma carteira e o mesmo provedor devolvem a conexão ativa.
  http.post('/api/wallet-connections', async ({ request }) => {
    await delay(800)
    const auth = authenticate(request)
    if ('error' in auth) return auth.error

    const body = (await request.json()) as { walletId?: string; provider?: WalletProvider }
    const wallet = db.wallets.find((w) => w.id === body.walletId && w.userId === auth.user.id)
    if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    if (!body.provider || !PROVIDERS.includes(body.provider)) {
      return apiError(400, 'VALIDATION_ERROR', 'Escolha como conectar sua carteira.', { provider: 'Provedor inválido.' })
    }
    if (getOption('wallet', 'ok') === 'refuse') {
      return apiError(403, 'FORBIDDEN', 'A conexão foi recusada na carteira. Tente de novo ou escolha outra carteira.')
    }

    const existing = db.connections.find(
      (c) => c.userId === auth.user.id && c.walletId === wallet.id && c.provider === body.provider && c.active,
    )
    if (existing) return HttpResponse.json(toConnection(existing))

    const connection = {
      id: `conn-${crypto.randomUUID().slice(0, 8)}`,
      userId: auth.user.id,
      walletId: wallet.id,
      provider: body.provider,
      connectedAt: new Date().toISOString(),
      active: true,
    }
    db.update((s) => {
      s.connections.push(connection)
    })
    return HttpResponse.json(toConnection(connection), { status: 201 })
  }),

  http.delete('/api/wallet-connections/:id', async ({ request, params }) => {
    await delay(300)
    const auth = authenticate(request)
    if ('error' in auth) return auth.error
    db.update((s) => {
      const row = s.connections.find((c) => c.id === String(params.id) && c.userId === auth.user.id)
      if (row) row.active = false
    })
    return new HttpResponse(null, { status: 204 })
  }),
]

function toConnection(c: WalletConnection): WalletConnection {
  return { id: c.id, walletId: c.walletId, provider: c.provider, connectedAt: c.connectedAt }
}